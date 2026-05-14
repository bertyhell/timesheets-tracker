import React, { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { orderBy } from 'lodash-es';
import { useAtom } from 'jotai';
import { searchTermAtom } from '../../store/store';
import {
  ActiveStateEventInfoDto,
  AutoTagEventInfoDto,
  CalendarEventInfoDto,
  ProgramEventInfoDto,
  TagEventInfoDto,
  TimelineEventDto,
  TimelineType,
  WebsiteEventInfoDto,
} from '../../generated/api/requests';

interface EventsTotalsTableProps {
  events: TimelineEventDto[];
  timelineType: TimelineType;
  className?: string;
}

interface TotalRow {
  category: string;
  durationMs: number;
}

function getCategoryLabel(event: TimelineEventDto, timelineType: TimelineType): string {
  const info = event.info;
  switch (timelineType) {
    case 'Program':
      return (info as ProgramEventInfoDto).programName;
    case 'ActiveState':
      return (info as ActiveStateEventInfoDto).isActive ? 'Active' : 'Inactive';
    case 'Tag':
      return (info as TagEventInfoDto).tagNameName;
    case 'AutoTag':
      return (info as AutoTagEventInfoDto).tagNameName;
    case 'Website':
      return (info as WebsiteEventInfoDto).websiteTitle;
    case 'Calendar':
      return (info as CalendarEventInfoDto).summary;
    default:
      return 'Unknown';
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

function EventsTotalsTable({ events, timelineType, className }: EventsTotalsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);

  const totals = useMemo(() => {
    const filtered = events.filter((e) =>
      JSON.stringify(e).toLowerCase().includes(searchTerm)
    );

    const map = new Map<string, number>();
    for (const event of filtered) {
      const category = getCategoryLabel(event, timelineType);
      const durationMs =
        parseISO(event.endedAt).getTime() - parseISO(event.startedAt).getTime();
      map.set(category, (map.get(category) ?? 0) + durationMs);
    }

    return orderBy(
      Array.from(map.entries()).map(([category, durationMs]): TotalRow => ({ category, durationMs })),
      (row) => row.durationMs,
      'desc'
    );
  }, [events, timelineType, searchTerm]);

  return (
    <div className={className}>
      <table className="w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th className="text-left pl-3">Category</th>
            <th className="text-right pr-3 w-24">Duration</th>
          </tr>
        </thead>
        <tbody>
          {totals.length === 0 ? (
            <tr>
              <td colSpan={2} className="text-center py-4 text-gray-400">
                No events
              </td>
            </tr>
          ) : (
            totals.map((row) => (
              <tr key={row.category}>
                <td className="pl-3">{row.category}</td>
                <td className="pr-3 text-right tabular-nums">{formatDuration(row.durationMs)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EventsTotalsTable;
