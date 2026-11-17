import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { z } from 'zod';

import type { TimelinesService } from '../../timelines/timelines.service';

import { TimelineType } from '../../types/types';
import { isoDateTimeSchema, runTool, timelineTypeSchema } from '../mcp-tool-helpers';

/**
 * Reading events and replaying the auto tag rules grows faster than linearly with the range: on a
 * real database a month took ~10s and two months over a minute, during which the backend (which
 * also records activity) is busy.
 */
const MAX_RANGE_DAYS = 31;
const DEFAULT_EVENT_LIMIT = 200;
const MAX_EVENT_LIMIT = 2000;

/** Timelines whose events count as "this time is tagged" for the onlyUntagged filter. */
const TAG_TIMELINE_TYPES = [TimelineType.Tag, TimelineType.AutoTag];

interface FlatEvent {
  timelineId: string;
  timelineTitle: string;
  timelineType: TimelineType;
  id: string;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  info: Record<string, unknown>;
}

const rangeShape = {
  startedAt: isoDateTimeSchema.describe('Start of the range, ISO 8601 date-time'),
  endedAt: isoDateTimeSchema.describe('End of the range, ISO 8601 date-time'),
  timelineTypes: z
    .array(timelineTypeSchema)
    .optional()
    .describe('Only return events of these timeline types, eg: ["Program", "Website"]'),
  timelineIds: z.array(z.string()).optional().describe('Only return events of these timelines'),
  search: z
    .string()
    .optional()
    .describe('Case insensitive text that must occur in one of the event info fields'),
  onlyUntagged: z
    .boolean()
    .optional()
    .describe(
      'Only keep the parts of events that are not covered by a manual tag or an auto tag. Useful to find activity your auto tag rules miss.'
    ),
};

type RangeArgs = {
  startedAt: string;
  endedAt: string;
  timelineTypes?: TimelineType[];
  timelineIds?: string[];
  search?: string;
  onlyUntagged?: boolean;
};

export function registerEventTools(server: McpServer, timelinesService: TimelinesService): void {
  server.registerTool(
    'list_timelines',
    {
      title: 'List timelines',
      description:
        'Lists the timelines (event sources) configured in the app: programs, websites, active/idle state, calendars, git commits, Jira, file edits, manual tags and auto tags. Timelines are read only through this server.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () =>
      runTool(async () => {
        const timelines = await timelinesService.findAllTimelines(undefined);
        return timelines.map((timeline) => ({
          id: timeline.id,
          title: timeline.title,
          timelineType: timeline.timelineType,
          visualOrder: timeline.visualOrder,
        }));
      })
  );

  server.registerTool(
    'query_events',
    {
      title: 'Query events',
      description: [
        'Returns the recorded activity in a time range, sorted by start time: active programs and window titles, visited websites, active/idle state, calendar events, git commits, Jira issues, file edits, manual tags and the tags produced by the auto tag rules.',
        'Events are read only. The `info` object of each event holds the fields auto tag conditions test (programName, windowTitle, websiteUrl, websiteTitle, ...).',
        'AutoTag events show which rule matched, so this is also how to check the effect of an auto tag change.',
        `The range may span at most ${MAX_RANGE_DAYS} days. Results are paginated with limit/offset.`,
        'Productive events are only returned for the first day of the range.',
      ].join(' '),
      inputSchema: {
        ...rangeShape,
        limit: z
          .number()
          .int()
          .min(1)
          .max(MAX_EVENT_LIMIT)
          .default(DEFAULT_EVENT_LIMIT)
          .describe('Maximum number of events to return'),
        offset: z.number().int().min(0).default(0).describe('Number of events to skip'),
      },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      runTool(async () => {
        const events = await fetchEvents(timelinesService, args);
        const page = events.slice(args.offset, args.offset + args.limit);
        return {
          total: events.length,
          offset: args.offset,
          returned: page.length,
          hasMore: args.offset + page.length < events.length,
          events: page,
        };
      })
  );

  server.registerTool(
    'summarize_events',
    {
      title: 'Summarize events',
      description: [
        'Groups the events in a time range by one info field and sums their duration, biggest first.',
        'Much cheaper than query_events for questions like "which programs/websites/window titles took most time" or, with onlyUntagged, "what activity do my auto tags not cover yet".',
        `The range may span at most ${MAX_RANGE_DAYS} days.`,
      ].join(' '),
      inputSchema: {
        ...rangeShape,
        groupBy: z
          .string()
          .default('programName')
          .describe(
            'Info field to group by, eg: programName, windowTitle, websiteUrl, websiteTitle, tagNameName, repoName, jiraIssueKey, summary. Events without that field are skipped.'
          ),
        top: z.number().int().min(1).max(500).default(50).describe('Number of groups to return'),
      },
      annotations: { readOnlyHint: true },
    },
    (args) =>
      runTool(async () => {
        const events = await fetchEvents(timelinesService, args);
        const groups = new Map<string, { totalMinutes: number; eventCount: number }>();
        for (const event of events) {
          const raw = event.info[args.groupBy];
          if (raw == null || raw === '') continue;
          const key = String(raw);
          const group = groups.get(key) ?? { totalMinutes: 0, eventCount: 0 };
          group.totalMinutes += event.durationMinutes;
          group.eventCount++;
          groups.set(key, group);
        }
        const sorted = [...groups.entries()]
          .map(([value, group]) => ({
            value,
            totalMinutes: round(group.totalMinutes),
            eventCount: group.eventCount,
          }))
          .sort((a, b) => b.totalMinutes - a.totalMinutes);
        return {
          groupBy: args.groupBy,
          groupCount: sorted.length,
          totalMinutes: round(sorted.reduce((total, group) => total + group.totalMinutes, 0)),
          groups: sorted.slice(0, args.top),
        };
      })
  );
}

async function fetchEvents(
  timelinesService: TimelinesService,
  args: RangeArgs
): Promise<FlatEvent[]> {
  const startMs = Date.parse(args.startedAt);
  const endMs = Date.parse(args.endedAt);
  if (endMs <= startMs) {
    throw new Error('endedAt must be after startedAt');
  }
  if (endMs - startMs > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
    throw new Error(`The range may span at most ${MAX_RANGE_DAYS} days`);
  }

  const startedAt = new Date(startMs).toISOString();
  const endedAt = new Date(endMs).toISOString();

  // All timelines are fetched, even when filtering: the auto tag analysis runs over the other
  // timelines' events, so leaving them out would change which auto tags show up.
  const [timelines, timelinesWithEvents] = await Promise.all([
    timelinesService.findAllTimelines(undefined),
    timelinesService.findAllEvents(startedAt, endedAt, undefined, undefined),
  ]);
  const titles = new Map(timelines.map((timeline) => [timeline.id, timeline.title]));

  const all: FlatEvent[] = timelinesWithEvents.flatMap((timeline) =>
    timeline.events.map((event) => ({
      timelineId: timeline.id,
      timelineTitle: titles.get(timeline.id) ?? '',
      timelineType: timeline.type,
      id: event.id,
      startedAt: event.startedAt,
      endedAt: event.endedAt,
      durationMinutes: minutesBetween(event.startedAt, event.endedAt),
      info: (event.info ?? {}) as unknown as Record<string, unknown>,
    }))
  );

  const tagIntervals = args.onlyUntagged
    ? mergeIntervals(
        all
          .filter((event) => TAG_TIMELINE_TYPES.includes(event.timelineType))
          .map((event) => [Date.parse(event.startedAt), Date.parse(event.endedAt)])
      )
    : [];

  const search = args.search?.toLowerCase();
  const filtered: FlatEvent[] = [];
  for (const event of all) {
    if (args.timelineTypes && !args.timelineTypes.includes(event.timelineType)) continue;
    if (args.timelineIds && !args.timelineIds.includes(event.timelineId)) continue;
    if (
      search &&
      !Object.values(event.info).some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(search)
      )
    ) {
      continue;
    }
    if (args.onlyUntagged) {
      if (TAG_TIMELINE_TYPES.includes(event.timelineType)) continue;
      const untaggedMs = subtractIntervals(
        [Date.parse(event.startedAt), Date.parse(event.endedAt)],
        tagIntervals
      );
      if (untaggedMs <= 0) continue;
      filtered.push({ ...event, durationMinutes: round(untaggedMs / 60000) });
      continue;
    }
    filtered.push(event);
  }

  return filtered.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

function minutesBetween(startedAt: string, endedAt: string): number {
  const ms = Date.parse(endedAt) - Date.parse(startedAt);
  return Number.isNaN(ms) ? 0 : round(Math.max(ms, 0) / 60000);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Sorts and merges overlapping [start, end] intervals. */
function mergeIntervals(intervals: number[][]): number[][] {
  const sorted = intervals
    .filter(([start, end]) => !Number.isNaN(start) && !Number.isNaN(end) && end > start)
    .sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/** Milliseconds of `[start, end]` not covered by the (merged, sorted) intervals. */
function subtractIntervals([start, end]: number[], covered: number[][]): number {
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  let remaining = end - start;
  for (const [coveredStart, coveredEnd] of covered) {
    if (coveredStart >= end) break;
    const overlap = Math.min(end, coveredEnd) - Math.max(start, coveredStart);
    if (overlap > 0) remaining -= overlap;
  }
  return remaining;
}
