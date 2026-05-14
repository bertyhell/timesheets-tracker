import React, { useEffect, useRef, useState } from 'react';
import {
  Cell,
  Column,
  Provider,
  Row,
  TableBody,
  TableHeader,
  TableView,
  useAsyncList,
  type AsyncListData,
  type Key,
  type Selection,
} from '@react-spectrum/s2';
import { orderBy } from 'lodash-es';
import { format, parseISO } from 'date-fns';
import { useAtom } from 'jotai';
import { searchTermAtom } from '../../store/store';
import { TimelineEventDto, TimelineWithEventsDto } from '../../generated/api/requests';
import { TimelineType } from '../Timeline/Timeline.types';
import { ColumnDef } from './Table.types';

const FIXED_COLUMNS: ColumnDef[] = [
  { key: 'startedAt', title: 'Start', width: 100, allowsSorting: true },
  { key: 'endedAt', title: 'End', width: 100, allowsSorting: true },
  { key: 'duration', title: 'Duration', width: 100, allowsSorting: true },
];

function getDynamicColumns(timelineType: string | undefined): ColumnDef[] {
  switch (timelineType) {
    case TimelineType.Program:
      return [
        { key: 'program', title: 'Program', allowsSorting: true, width: 200 },
        { key: 'title', title: 'Title', allowsSorting: true },
      ];

    case TimelineType.ActiveState:
      return [{ key: 'isActive', title: 'Active', allowsSorting: true }];

    case TimelineType.Tag:
      return [{ key: 'tagName', title: 'Tag', allowsSorting: true }];

    case TimelineType.AutoTag:
      return [{ key: 'tagName', title: 'Tag', allowsSorting: true }];

    case TimelineType.Website:
      return [{ key: 'websiteName', title: 'Website', allowsSorting: true }];

    case TimelineType.Calendar:
      return [{ key: 'summary', title: 'Summary', allowsSorting: true }];

    default:
      return [];
  }
}

function getCellValue(event: TimelineEventDto, columnKey: Key): string {
  const info = event.info as Record<string, string | number | boolean>;
  switch (columnKey) {
    case 'program':
      return String(info['programName'] ?? '');
    case 'title':
      return String(info['windowTitle'] ?? '');
    case 'isActive':
      return info['isActive'] ? 'Active' : 'Inactive';
    case 'tagName':
      return String(info['tagNameName'] ?? info['name'] ?? '');
    case 'websiteName':
      return String(info['websiteTitle'] ?? info['title'] ?? '');
    case 'summary':
      return String(info['summary'] ?? '');
    case 'startedAt':
      return format(parseISO(event.startedAt), 'HH:mm:ss');
    case 'endedAt':
      return format(parseISO(event.endedAt), 'HH:mm:ss');
    case 'duration':
      return format(
        new Date(parseISO(event.endedAt).getTime() - parseISO(event.startedAt).getTime()),
        'HH:mm:ss'
      );
    default:
      return '';
  }
}

interface EventsTableProps {
  timeline: TimelineWithEventsDto | null;
  events: TimelineEventDto[];
  className?: string;
}

export function EventsTable({ timeline, events, className }: EventsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([0]));

  // Keep refs updated synchronously so the load closure always reads latest values
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const searchTermRef = useRef(searchTerm);
  searchTermRef.current = searchTerm;

  const columns = [...getDynamicColumns(timeline?.type), ...FIXED_COLUMNS];

  const tableEvents = useAsyncList<TimelineEventDto>({
    initialSortDescriptor: { column: 'startedAt', direction: 'ascending' },
    async load() {
      return {
        items: eventsRef.current.filter((event) =>
          JSON.stringify(event).toLowerCase().includes(searchTermRef.current)
        ),
      };
    },
    async sort({
      items,
      sortDescriptor,
    }: {
      items: TimelineEventDto[];
      sortDescriptor: AsyncListData<TimelineEventDto>['sortDescriptor'];
    }) {
      return {
        items: orderBy(
          items,
          [
            (event) => {
              switch (sortDescriptor?.column) {
                case 'program':
                  return (event.info as any)['programName'];
                case 'title':
                  return (event.info as any)['windowTitle'];
                case 'isActive':
                  return (event.info as any)['isActive'];
                case 'tagName':
                  return (event.info as any)['tagNameName'];
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
              }
            },
          ],
          sortDescriptor?.direction === 'descending' ? ['desc'] : ['asc']
        ),
      };
    },
  });

  useEffect(() => {
    tableEvents.reload();
  }, [timeline?.id, events, searchTerm]);

  return (
    <div className={'c-spectrum-table ' + className}>
      <Provider colorScheme="light">
        <TableView
          key={columns.map((c) => c.key).join(',')}
          aria-label="Timeline events"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={tableEvents.sortDescriptor}
          onSortChange={tableEvents.sort}
          density="compact"
          loadingState={tableEvents.loadingState}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <Column
                id={column.key}
                isRowHeader={column.key === columns[0]?.key}
                allowsSorting={column.allowsSorting}
                width={column.width}
              >
                {column.title}
              </Column>
            )}
          </TableHeader>
          <TableBody items={tableEvents.items} renderEmptyState={() => <>No events</>}>
            {(event) => (
              <Row id={event.id} columns={columns}>
                {(column) => <Cell>{getCellValue(event, column.key)}</Cell>}
              </Row>
            )}
          </TableBody>
        </TableView>
      </Provider>
    </div>
  );
}
