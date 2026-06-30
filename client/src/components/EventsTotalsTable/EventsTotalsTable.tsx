import React, { useCallback, useMemo, useRef, useState } from 'react';
import './EventsTotalsTable.css';
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
} from '../../generated/api/types.gen';
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
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

    const map = new Map<string, number>();
    for (const event of filtered) {
      const category = getCategoryLabel(event, timelineType);
      const durationMs = parseISO(event.endedAt).getTime() - parseISO(event.startedAt).getTime();
      map.set(category, (map.get(category) ?? 0) + durationMs);
    }

    const rows: TotalRow[] = Array.from(map.entries()).map(([category, durationMs]) => ({
      id: category,
      category,
      durationMs,
      duration: formatDuration(durationMs),
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
            const row = sortedTotals[virtualRow.index];
            return (
              <tr
                key={virtualRow.key}
                style={{ height: ROW_HEIGHT }}
                aria-selected={selectedKey === row.id}
                className={selectedKey === row.id ? 'is-selected' : undefined}
                onClick={() => setSelectedKey(row.id)}
              >
                {columns.map((col) => (
                  <td key={col.id}>{String(row[col.id as keyof TotalRow] ?? '')}</td>
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
        {sortedTotals.length > 0 && (
          <tfoot>
            <tr className="c-table-total-row">
              <td>Total</td>
              <td>{formatDuration(grandTotalMs)}</td>
            </tr>
          </tfoot>
        )}
      </table>
      {sortedTotals.length === 0 && <div className="c-table-empty">No events</div>}
    </div>
  );
}
