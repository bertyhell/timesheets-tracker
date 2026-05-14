import React, { useMemo, useState } from 'react';
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
import {
  Cell,
  Column,
  Provider,
  Row,
  TableBody,
  TableHeader,
  TableView,
  type SortDescriptor,
  type Selection,
} from '@react-spectrum/s2';

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
  { key: 'category', title: 'Category', allowsSorting: true },
  { key: 'duration', title: 'Duration', width: 120, allowsSorting: true },
];

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

export function EventsTotalsTable({ events, timelineType, className }: EventsTotalsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([0]));

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'duration',
    direction: 'descending',
  });

  const sortedTotals: TotalRow[] = useMemo(() => {
    const filtered = events.filter((e) => JSON.stringify(e).toLowerCase().includes(searchTerm));

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

  return (
    <div className={className}>
      <Provider colorScheme="light">
        <TableView
          key={columns.map((c) => c.key).join(',')}
          aria-label="Timeline event totals"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          density="compact"
        >
          <TableHeader columns={columns}>
            {(column) => (
              <Column
                id={column.key}
                isRowHeader={true}
                width={column.width}
                allowsSorting={column.allowsSorting}
              >
                {column.title}
              </Column>
            )}
          </TableHeader>
          <TableBody items={sortedTotals} renderEmptyState={() => <>No events</>}>
            {(row) => (
              <Row id={row.id} columns={columns}>
                {(column) => <Cell>{String(row[column.key as keyof TotalRow] ?? '')}</Cell>}
              </Row>
            )}
          </TableBody>
        </TableView>
      </Provider>
    </div>
  );
}
