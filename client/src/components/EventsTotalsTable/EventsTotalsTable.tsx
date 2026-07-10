import React, { useCallback, useMemo, useRef, useState } from 'react';
import './EventsTotalsTable.css';
import { parseISO } from 'date-fns';
import { formatDuration } from '../../helpers/format-duration';
import { orderBy } from 'lodash-es';
import { useAtom } from 'jotai';
import { searchTermAtom } from '../../store/store';
import {
  ActiveStateEventInfoDto,
  AutoTagEventInfoDto,
  CalendarEventInfoDto,
  ProgramEventInfoDto,
  TagEventInfoDto,
  TimelineDto,
  TimelineEventDto,
  TimelineType,
  WebsiteEventInfoDto,
} from '../../generated/api/types.gen';
import { getColorForEvent } from '../Timeline/helpers/getColorForEvent';
import { useVirtualizer } from '@tanstack/react-virtual';

interface SortDescriptor {
  column: string;
  direction: 'ascending' | 'descending';
}

interface EventsTotalsTableProps {
  events: TimelineEventDto[];
  timelineType: TimelineType;
  className?: string;
}

interface TotalRow {
  id: string;
  category: string;
  color: string;
  durationMs: number;
  duration: string;
}

const columns = [
  { id: 'category', title: 'Category', allowsSorting: true, width: undefined },
  { id: 'duration', title: 'Duration', width: 130, allowsSorting: true },
] as const;

const ROW_HEIGHT = 32;

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
      return (info as AutoTagEventInfoDto).tagNameTitle;
    case 'Website':
      return (info as WebsiteEventInfoDto).websiteTitle;
    case 'Calendar':
      return (info as CalendarEventInfoDto).summary;
    default:
      return 'Unknown';
  }
}


export function EventsTotalsTable({ events, timelineType, className }: EventsTotalsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'duration',
    direction: 'descending',
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const sortedTotals: TotalRow[] = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const filtered = lowerSearch
      ? events.filter((e) => JSON.stringify(e).toLowerCase().includes(lowerSearch))
      : events;

    const map = new Map<string, { durationMs: number; color: string }>();
    const fakeTimelineDto = { timelineType } as unknown as TimelineDto;
    for (const event of filtered) {
      const category = getCategoryLabel(event, timelineType);
      const durationMs = parseISO(event.endedAt).getTime() - parseISO(event.startedAt).getTime();
      const existing = map.get(category);
      const color = existing?.color ?? getColorForEvent(fakeTimelineDto, event);
      map.set(category, { durationMs: (existing?.durationMs ?? 0) + durationMs, color });
    }

    const rows: TotalRow[] = Array.from(map.entries()).map(([category, { durationMs, color }]) => ({
      id: category,
      category,
      color,
      durationMs,
      duration: formatDuration(durationMs / 1000),
    }));

    return orderBy(
      rows,
      [(row) => (sortDescriptor.column === 'duration' ? row.durationMs : row.category)],
      [sortDescriptor.direction === 'descending' ? 'desc' : 'asc']
    );
  }, [events, timelineType, searchTerm, sortDescriptor.column, sortDescriptor.direction]);

  const getItemKey = useCallback(
    (index: number) => sortedTotals[index]?.id ?? index,
    [sortedTotals]
  );

  const virtualizer = useVirtualizer({
    count: sortedTotals.length,
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

  const grandTotalMs = useMemo(
    () => sortedTotals.reduce((sum, row) => sum + row.durationMs, 0),
    [sortedTotals]
  );

  return (
    <div ref={parentRef} className={`c-events-totals-table${className ? ` ${className}` : ''}`}>
      <table className="c-table" aria-label="Timeline event totals">
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
            const row = sortedTotals[virtualRow.index];
            return (
              <tr
                key={virtualRow.key}
                style={{ height: ROW_HEIGHT }}
                aria-selected={selectedKey === row.id}
                className={selectedKey === row.id ? 'is-selected' : undefined}
                onClick={() => setSelectedKey(row.id)}
              >
                <td style={{ padding: '0 0 0 8px' }}>
                  <span
                    className="block h-5 w-5 rounded-md"
                    style={{ backgroundColor: row.color }}
                  />
                </td>
                {columns.map((col) => (
                  <td key={col.id}>{String(row[col.id as keyof TotalRow] ?? '')}</td>
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
        {sortedTotals.length > 0 && (
          <tfoot>
            <tr className="c-table-total-row">
              <td></td>
              <td>Total</td>
              <td>{formatDuration(grandTotalMs / 1000)}</td>
            </tr>
          </tfoot>
        )}
      </table>
      {sortedTotals.length === 0 && <div className="c-table-empty">No events</div>}
    </div>
  );
}
