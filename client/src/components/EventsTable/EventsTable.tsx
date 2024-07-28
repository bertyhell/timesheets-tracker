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
import { type TimelineEvent } from '../Timeline/Timeline.types';
import { orderBy } from 'lodash-es';
import { format } from 'date-fns';
import { useAtom } from 'jotai/index';
import { searchTermAtom } from '../../store/store';

interface EventsTableProps {
  events: TimelineEvent[];
}

function EventsTable({ events }: EventsTableProps) {
  const [searchTerm] = useAtom(searchTermAtom);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([0]));

  const tableEvents = useAsyncList<TimelineEvent>({
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
      items: TimelineEvent[];
      sortDescriptor: AsyncListData<TimelineEvent>['sortDescriptor'];
    }) {
      return {
        items: orderBy(
          items,
          [
            (event) => {
              switch (sortDescriptor?.column) {
                case 'program':
                  return event.info[Object.keys(event.info)[0]];

                case 'title':
                  return event.info[Object.keys(event.info)[1]];

                case 'startedAt':
                  return event.startedAt;

                case 'endedAt':
                  return event.endedAt;

                case 'duration':
                  return event.endedAt.getTime() - event.startedAt.getTime();
              }
            },
          ],
          sortDescriptor?.direction === 'descending' ? ['desc'] : ['asc']
        ),
      };
    },
  });

  useEffect(() => {
    console.log('search term: ' + searchTerm);
    if (events?.length && !tableEvents.items.length) {
      tableEvents.reload();
    }
  }, [events, searchTerm]);

  const renderTooltipContent = () => {
    return (
      <ul
        className="c-events-table__event-tooltip__content"
        key={'c-events-table__event-tooltip__content'}
      >
        <li>selected events</li>
      </ul>
    );
  };

  return (
    <div>
      <Provider theme={defaultTheme} colorScheme="light">
        {/*<Tippy*/}
        {/*  key="c-events-table__event-tooltip"*/}
        {/*  visible={!!selectedKeys}*/}
        {/*  interactive*/}
        {/*  content={renderTooltipContent()}*/}
        {/*>*/}
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
            {tableEvents.items.map((event: TimelineEvent) => {
              return (
                <Row key={event.id}>
                  <Cell>{event.info[Object.keys(event.info)[0]]}</Cell>
                  <Cell>{event.info[Object.keys(event.info)[1]]}</Cell>
                  <Cell>{format(event.startedAt, 'HH:mm:ss')}</Cell>
                  <Cell>{format(event.endedAt, 'HH:mm:ss')}</Cell>
                  <Cell>
                    {format(event.endedAt.getTime() - event.startedAt.getTime(), 'HH:mm:ss')}
                  </Cell>
                </Row>
              );
            })}
          </TableBody>
        </TableView>
        {/*</Tippy>*/}
      </Provider>
    </div>
  );
}

export default EventsTable;
