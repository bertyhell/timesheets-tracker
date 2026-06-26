import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { orderBy } from 'lodash-es';
import { format, intervalToDuration, parseISO } from 'date-fns';
import { useAtom } from 'jotai';
import { searchTermAtom } from '../../store/store';
import type { TimelineEventDto, TimelineWithEventsDto } from '../../generated/api/types.gen';
import { TimelineType } from '../Timeline/Timeline.types';
import { ColumnDef } from './Table.types';

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
    case 'startedAt':
      return format(parseISO(event.startedAt), 'HH:mm:ss');
    case 'endedAt':
      return format(parseISO(event.endedAt), 'HH:mm:ss');
    case 'duration': {
      const duration = intervalToDuration({
        start: parseISO(event.startedAt).getTime(),
        end: parseISO(event.endedAt).getTime(),
      });
      return [
        String(duration.hours ?? 0).padStart(2, '0'),
        String(duration.minutes ?? 0).padStart(2, '0'),
        String(duration.seconds ?? 0).padStart(2, '0'),
      ].join(':');
    }
    default:
      return '';
  }
}

const ROW_HEIGHT = 32;

interface EventsTableProps {
  timeline: TimelineWithEventsDto | null;
  events: TimelineEventDto[];
  className?: string;
}

export function EventsTable({ timeline, events, className }: EventsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'startedAt',
    direction: 'ascending',
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const columns = [...getDynamicColumns(timeline?.type), ...FIXED_COLUMNS];

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

  const getItemKey = useCallback((index: number) => sortedItems[index]?.id ?? index, [sortedItems]);

  const virtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    getItemKey,
  });

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

  return (
    <div ref={parentRef} className={`c-events-table${className ? ` ${className}` : ''}`}>
      <table className="c-table" aria-label="Timeline events">
        <colgroup>
          {columns.map((col) => (
            <col key={col.id} style={{ width: col.width ? `${col.width}px` : undefined }} />
          ))}
        </colgroup>
        <thead>
          <tr>
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
              <td colSpan={columns.length} style={{ height: paddingTop, padding: 0 }} />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const event = sortedItems[virtualRow.index];
            return (
              <tr
                key={virtualRow.key}
                style={{ height: ROW_HEIGHT }}
                aria-selected={selectedKey === event.id}
                className={selectedKey === event.id ? 'is-selected' : undefined}
                onClick={() => setSelectedKey(event.id)}
              >
                {columns.map((col) => (
                  <td key={col.id}>{getCellValue(event, col.id)}</td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr aria-hidden="true">
              <td colSpan={columns.length} style={{ height: paddingBottom, padding: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
      {sortedItems.length === 0 && <div className="c-table-empty">No events</div>}
    </div>
  );
}
