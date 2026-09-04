import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { orderBy } from 'lodash-es';
import { differenceInSeconds, format, parseISO, roundToNearestMinutes } from 'date-fns';
import { formatDuration } from '../../helpers/format-duration';
import { useAtom } from 'jotai';
import { searchTermAtom } from '../../store/store';
import type {
  TimelineDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../../generated/api/types.gen';
import { TimelineType } from '../Timeline/Timeline.types';
import { ColumnDef } from './Table.types';
import { getColorForEvent } from '../Timeline/helpers/getColorForEvent';
import {
  getMostProminentConditions,
  type ProminentCondition,
} from '../Timeline/helpers/getMostProminentConditions';
import { ContextMenu } from '../ContextMenu/ContextMenu';

function copyEventToClipboard(event: TimelineEventDto) {
  const startStr = format(roundToNearestMinutes(parseISO(event.startedAt)), 'yyyy-MM-dd HH:mm');
  const endStr = format(roundToNearestMinutes(parseISO(event.endedAt)), 'HH:mm');
  const durationSec = differenceInSeconds(parseISO(event.endedAt), parseISO(event.startedAt));
  const durationStr = formatDuration(durationSec);
  const info = event.info as Record<string, unknown>;
  const infoLines = Object.entries(info)
    .filter(([, val]) => val !== '' && val !== null && val !== undefined)
    .map(([key, val]) => `${key}: ${typeof val === 'object' ? JSON.stringify(val) : val}`)
    .join('\n');
  const text = [`Start: ${startStr}`, `End: ${endStr}`, `Duration: ${durationStr}`, '', infoLines]
    .filter(Boolean)
    .join('\n');
  navigator.clipboard.writeText(text);
}

interface SortDescriptor {
  column: string;
  direction: 'ascending' | 'descending';
}

const FIXED_COLUMNS: ColumnDef[] = [
  { id: 'startedAt', title: 'Start', width: 100, allowsSorting: true },
  { id: 'endedAt', title: 'End', width: 100, allowsSorting: true },
  { id: 'duration', title: 'Duration', width: 100, allowsSorting: true },
];

function getDynamicColumns(timelineType: string | undefined): ColumnDef[] {
  switch (timelineType) {
    case TimelineType.Program:
      return [
        { id: 'program', title: 'Program', allowsSorting: true, width: 150 },
        { id: 'title', title: 'Title', allowsSorting: true, width: 150 },
      ];

    case TimelineType.ActiveState:
      return [{ id: 'isActive', title: 'Active', allowsSorting: true }];

    case TimelineType.Tag:
      return [{ id: 'tagName', title: 'Tag', allowsSorting: true }];

    case TimelineType.AutoTag:
      return [{ id: 'tagName', title: 'Tag', allowsSorting: true }];

    case TimelineType.Website:
      return [{ id: 'websiteName', title: 'Website', allowsSorting: true }];

    case TimelineType.Calendar:
      return [{ id: 'summary', title: 'Summary', allowsSorting: true }];

    case TimelineType.GitCommit:
      return [
        { id: 'repoName', title: 'Repository', allowsSorting: true, width: 150 },
        { id: 'commitMessage', title: 'Commit message', allowsSorting: true },
      ];

    case TimelineType.Productive:
      return [
        { id: 'serviceProject', title: 'Project', allowsSorting: true, width: 150 },
        { id: 'serviceName', title: 'Service', allowsSorting: true, width: 150 },
      ];

    default:
      return [];
  }
}

function getCellValue(event: TimelineEventDto, columnKey: string): string {
  const info = event.info as Record<string, string | number | boolean>;
  switch (columnKey) {
    case 'program':
      return String(info['programName'] ?? '');
    case 'title':
      return String(info['windowTitle'] ?? '');
    case 'isActive':
      return info['isActive'] ? 'Active' : 'Inactive';
    case 'tagName':
      return String(info['tagNameName'] ?? info['tagNameTitle'] ?? info['name'] ?? '');
    case 'websiteName':
      return String(info['websiteTitle'] ?? info['title'] ?? '');
    case 'summary':
      return String(info['summary'] ?? '');
    case 'repoName':
      return String(info['repoName'] ?? '');
    case 'commitMessage':
      return String(info['commitMessage'] ?? '');
    case 'serviceProject':
      return String(info['serviceProject'] ?? '');
    case 'serviceName':
      return String(info['serviceName'] ?? '');
    case 'startedAt':
      return format(roundToNearestMinutes(parseISO(event.startedAt)), 'HH:mm');
    case 'endedAt':
      return format(roundToNearestMinutes(parseISO(event.endedAt)), 'HH:mm');
    case 'duration':
      return formatDuration(differenceInSeconds(parseISO(event.endedAt), parseISO(event.startedAt)));
    default:
      return '';
  }
}

const ROW_HEIGHT = 32;

interface EventsTableProps {
  timeline: TimelineWithEventsDto | null;
  events: TimelineEventDto[];
  className?: string;
  onAddBulkTag?: (events: TimelineEventDto[]) => void;
  onSelectionChange?: (events: TimelineEventDto[]) => void;
  /** Ids selected outside of this table (e.g. in the timeline); keeps both views in sync. */
  selectedEventIds?: string[];
  onEditTag?: (eventId: string) => void;
  onDeleteTag?: (eventId: string) => void;
  onCreateTagFromEvent?: (startedAt: string, endedAt: string) => void;
  onCreateAutoTagRuleFromEvent?: (conditions: ProminentCondition[]) => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  eventId: string;
  event: TimelineEventDto;
  isBulk: boolean;
}

export function EventsTable({ timeline, events, className, onAddBulkTag, onSelectionChange, selectedEventIds, onEditTag, onDeleteTag, onCreateTagFromEvent, onCreateAutoTagRuleFromEvent }: EventsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'startedAt',
    direction: 'ascending',
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const columns = [...getDynamicColumns(timeline?.type), ...FIXED_COLUMNS];
  const fakeTimelineDto = timeline
    ? ({ timelineType: timeline.type } as unknown as TimelineDto)
    : null;

  const sortedItems = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = lowerSearch
      ? events.filter((e) => JSON.stringify(e).toLowerCase().includes(lowerSearch))
      : events;

    return orderBy(
      filtered,
      [
        (event) => {
          switch (sortDescriptor.column) {
            case 'program':
              return (event.info as any)['programName'];
            case 'title':
              return (event.info as any)['windowTitle'];
            case 'isActive':
              return (event.info as any)['isActive'];
            case 'tagName':
              return (event.info as any)['tagNameName'] ?? (event.info as any)['tagNameTitle'];
            case 'websiteName':
              return (event.info as any)['websiteTitle'];
            case 'summary':
              return (event.info as any)['summary'];
            case 'repoName':
              return (event.info as any)['repoName'];
            case 'commitMessage':
              return (event.info as any)['commitMessage'];
            case 'serviceProject':
              return (event.info as any)['serviceProject'];
            case 'serviceName':
              return (event.info as any)['serviceName'];
            case 'startedAt':
              return event.startedAt;
            case 'endedAt':
              return event.endedAt;
            case 'duration':
              return parseISO(event.endedAt).getTime() - parseISO(event.startedAt).getTime();
            default:
              return '';
          }
        },
      ],
      [sortDescriptor.direction === 'descending' ? 'desc' : 'asc']
    );
  }, [events, searchTerm, sortDescriptor]);

  useEffect(() => {
    onSelectionChange?.(sortedItems.filter((event) => selectedKeys.has(event.id)));
  }, [selectedKeys, sortedItems, onSelectionChange]);

  // Mirror an externally driven selection (timeline clicks) into the table.
  const externalSelectionKey = (selectedEventIds ?? []).join(',');
  useEffect(() => {
    if (!selectedEventIds) return;
    setSelectedKeys(new Set(selectedEventIds));
    setLastClickedIndex(
      selectedEventIds.length ? sortedItems.findIndex((e) => e.id === selectedEventIds[0]) : null
    );
  }, [externalSelectionKey]);

  const getItemKey = useCallback((index: number) => sortedItems[index]?.id ?? index, [sortedItems]);

  const virtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    getItemKey,
  });

  useEffect(() => {
    if (!selectedEventIds?.length) return;
    const firstIndex = sortedItems.findIndex((event) => event.id === selectedEventIds[0]);
    if (firstIndex >= 0) {
      virtualizer.scrollToIndex(firstIndex, { align: 'auto' });
    }
  }, [externalSelectionKey, sortedItems]);

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? (virtualItems[0]?.start ?? 0) : 0;
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0) : 0;

  const handleSort = (columnId: string) => {
    setSortDescriptor((prev) => ({
      column: columnId,
      direction:
        prev.column === columnId && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const handleRowClick = (e: React.MouseEvent, id: string, index: number) => {
    if (e.shiftKey && lastClickedIndex !== null) {
      const lo = Math.min(lastClickedIndex, index);
      const hi = Math.max(lastClickedIndex, index);
      const rangeIds = sortedItems.slice(lo, hi + 1).map((item) => item.id);
      setSelectedKeys(new Set(rangeIds));
    } else {
      setSelectedKeys(new Set([id]));
      setLastClickedIndex(index);
    }
  };

  const isTagTimeline =
    timeline?.type === TimelineType.Tag || timeline?.type === TimelineType.AutoTag;

  const handleRowContextMenu = (e: React.MouseEvent, id: string) => {
    const event = sortedItems.find((ev) => ev.id === id);
    if (!event) return;
    const isBulk = selectedKeys.size >= 2 && selectedKeys.has(id) && !!onAddBulkTag;
    if (!isTagTimeline && !isBulk && !onCreateTagFromEvent && !onCreateAutoTagRuleFromEvent) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, eventId: id, event, isBulk });
  };

  return (
    <div ref={parentRef} className={`c-events-table${className ? ` ${className}` : ''}`}>
      <table className="c-table" aria-label="Timeline events" style={{ userSelect: 'none' }}>
        <colgroup>
          <col style={{ width: '36px' }} />
          {columns.map((col) => (
            <col key={col.id} style={{ width: col.width ? `${col.width}px` : undefined }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th style={{ width: '36px' }}></th>
            {columns.map((col) => (
              <th
                key={col.id}
                aria-sort={
                  sortDescriptor.column === col.id
                    ? sortDescriptor.direction === 'ascending'
                      ? 'ascending'
                      : 'descending'
                    : col.allowsSorting
                      ? 'none'
                      : undefined
                }
              >
                {col.allowsSorting ? (
                  <button className="c-table-sort-btn" onClick={() => handleSort(col.id)}>
                    {col.title}
                    {sortDescriptor.column === col.id && (
                      <span aria-hidden="true">
                        {sortDescriptor.direction === 'ascending' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </button>
                ) : (
                  col.title
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length + 1} style={{ height: paddingTop, padding: 0 }} />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const event = sortedItems[virtualRow.index];
            const color = fakeTimelineDto ? getColorForEvent(fakeTimelineDto, event) : undefined;
            const isSelected = selectedKeys.has(event.id);
            return (
              <tr
                key={virtualRow.key}
                style={{ height: ROW_HEIGHT }}
                aria-selected={isSelected}
                className={isSelected ? 'is-selected' : undefined}
                onClick={(e) => handleRowClick(e, event.id, virtualRow.index)}
                onContextMenu={(e) => handleRowContextMenu(e, event.id)}
              >
                <td style={{ padding: '0 0 0 8px' }}>
                  <span
                    className="block h-5 w-5 rounded-md"
                    style={{ backgroundColor: color ?? 'transparent' }}
                  />
                </td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    title={col.id === 'commitMessage' ? getCellValue(event, col.id) : undefined}
                    style={col.id === 'commitMessage' ? { maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : undefined}
                  >
                    {getCellValue(event, col.id)}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length + 1} style={{ height: paddingBottom, padding: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
      {sortedItems.length === 0 && <div className="c-table-empty">No events</div>}
      {contextMenu && (
        <ContextMenu
          position={contextMenu}
          items={[
            ...(contextMenu.isBulk
              ? [
                  {
                    label: `Add tag to ${selectedKeys.size} events`,
                    onClick: () => {
                      const selected = sortedItems.filter((e) => selectedKeys.has(e.id));
                      onAddBulkTag?.(selected);
                    },
                  },
                ]
              : []),
            ...(isTagTimeline
              ? [
                  { label: 'Edit tag', onClick: () => onEditTag?.(contextMenu.eventId) },
                  {
                    label: 'Delete tag',
                    onClick: () => onDeleteTag?.(contextMenu.eventId),
                    variant: 'danger' as const,
                  },
                  {
                    label: 'Copy to clipboard',
                    onClick: () => copyEventToClipboard(contextMenu.event),
                  },
                ]
              : [
                  ...(onCreateTagFromEvent
                    ? [
                        {
                          label: 'Create tag',
                          onClick: () =>
                            onCreateTagFromEvent(
                              contextMenu.event.startedAt,
                              contextMenu.event.endedAt
                            ),
                        },
                      ]
                    : []),
                  ...(onCreateAutoTagRuleFromEvent
                    ? [
                        {
                          label: 'Create autotag rule',
                          onClick: () => {
                            const conditions = fakeTimelineDto
                              ? getMostProminentConditions(fakeTimelineDto, contextMenu.event)
                              : [];
                            onCreateAutoTagRuleFromEvent(conditions);
                          },
                        },
                      ]
                    : []),
                  {
                    label: 'Copy to clipboard',
                    onClick: () => copyEventToClipboard(contextMenu.event),
                  },
                ]),
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
