import React, { useEffect, useState } from 'react';
import {
  Cell,
  Column,
  defaultTheme,
  Provider,
  Row,
  TableBody,
  TableHeader,
  TableView,
  useAsyncList,
  type Selection,
  type AsyncListData,
} from '@adobe/react-spectrum';
import { orderBy } from 'lodash-es';
import { format, parseISO } from 'date-fns';
import { useAtom } from 'jotai';
import { searchTermAtom } from '../../store/store';
import { TimelineEventDto } from '../../generated/api/requests';

interface EventsTableProps {
  events: TimelineEventDto[];
  className?: string;
}

function EventsTable({ events, className }: EventsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([0]));

  const tableEvents = useAsyncList<TimelineEventDto>({
    initialSortDescriptor: {
      column: 'startedAt',
      direction: 'ascending',
    },
    async load() {
      return {
        items:
          events.filter((event) => JSON.stringify(event).toLowerCase().includes(searchTerm)) || [],
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
                // TODO switch rendering of columns based on selected timeline
                case 'program':
                  return (event.info as any)[Object.keys(event.info as any)[0] as any] as any;

                case 'title':
                  return (event.info as any)[Object.keys(event.info as any)[1] as any] as any;

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
    if (events?.length && !tableEvents.items.length) {
      tableEvents.reload();
    }
  }, [events, searchTerm]);

  return (
    <div className={className}>
      <Provider theme={defaultTheme} colorScheme="light">
        <TableView
          aria-label="Example table with static contents"
          selectionMode="multiple"
          selectionStyle="highlight"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          sortDescriptor={tableEvents.sortDescriptor}
          onSortChange={tableEvents.sort}
          density="compact"
          renderEmptyState={() => <>No events</>}
        >
          <TableHeader>
            <Column key="program" allowsSorting width={200}>
              Program
            </Column>
            <Column key="title" allowsSorting>
              Title
            </Column>
            <Column key="startedAt" allowsSorting width={100}>
              Start
            </Column>
            <Column key="endedAt" allowsSorting width={100}>
              End
            </Column>
            <Column key="duration" allowsSorting width={100}>
              Duration
            </Column>
          </TableHeader>
          <TableBody items={tableEvents.items} loadingState={tableEvents.loadingState}>
            {tableEvents.items.map((event: TimelineEventDto) => {
              return (
                <Row key={event.id}>
                  <Cell>
                    {(event.info as any)[Object.keys(event.info as any)[0] as any] as any}
                  </Cell>
                  <Cell>
                    {(event.info as any)[Object.keys(event.info as any)[1] as any] as any}
                  </Cell>
                  <Cell>{format(parseISO(event.startedAt), 'HH:mm:ss')}</Cell>
                  <Cell>{format(parseISO(event.endedAt), 'HH:mm:ss')}</Cell>
                  <Cell>
                    {format(
                      parseISO(event.endedAt).getTime() - parseISO(event.startedAt).getTime(),
                      'HH:mm:ss'
                    )}
                  </Cell>
                </Row>
              );
            })}
          </TableBody>
        </TableView>
      </Provider>
    </div>
  );
}

export default EventsTable;
