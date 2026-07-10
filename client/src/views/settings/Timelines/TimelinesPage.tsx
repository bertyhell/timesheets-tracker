import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  timelinesControllerDeleteMutation,
  timelinesControllerFindAllOptions,
} from '../../../generated/api/@tanstack/react-query.gen';
import React, { type ReactNode, useEffect, useState } from 'react';
import { ROUTE_PARTS } from '../../../App';
import { toast } from 'react-toastify';
import { orderBy } from 'lodash-es';
import './TimelinesPage.css';
import { SearchInput } from '../../../components/SearchInput/SearchInput';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { TimelineDto } from '../../../generated/api/types.gen';
import { GripHandle } from '../../../components/GripHandle/GripHandle';
import { reorderTimelines as reorderTimelinesApi } from '../../../api/reorder';

function TimelineDragOverlay({ timeline }: { timeline: TimelineDto }) {
  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', background: 'white', opacity: 0.95 }}>
      <tbody>
        <tr>
          <td style={{ width: 28, paddingLeft: 8, color: '#888' }}><GripHandle /></td>
          <td style={{ width: 28, paddingLeft: 8 }}>
            <span style={{ display: 'block', height: 20, width: 20, borderRadius: 6, backgroundColor: timeline.color ?? 'transparent' }} />
          </td>
          <td style={{ paddingLeft: 12 }}>{timeline.title}</td>
          <td style={{ paddingLeft: 12 }}>{timeline.timelineType}</td>
          <td style={{ paddingLeft: 12 }}>{timeline.visualOrder}</td>
          <td /><td />
        </tr>
      </tbody>
    </table>
  );
}

function SortableTimelineRow({
  timeline,
  dragEnabled,
  activeId,
  overId,
  sortedList,
  onEdit,
  onDelete,
}: {
  timeline: TimelineDto;
  dragEnabled: boolean;
  activeId: string | null;
  overId: string | null;
  sortedList: TimelineDto[];
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: timeline.id });

  const activeIndex = sortedList.findIndex((t) => t.id === activeId);
  const overIndex = sortedList.findIndex((t) => t.id === overId);
  const isOver = overId === timeline.id && activeId !== timeline.id;
  const showBorderTop = isOver && activeIndex > overIndex;
  const showBorderBottom = isOver && activeIndex < overIndex;

  return (
    <tr
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.4 : 1 }}
      className={[
        showBorderTop ? 'drag-drop-border-top' : '',
        showBorderBottom ? 'drag-drop-border-bottom' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onEdit}
    >
      <td
        className="w-px py-1 pl-2"
        style={{ color: '#aaa', cursor: dragEnabled ? 'grab' : 'default', userSelect: 'none' }}
        onClick={(e) => e.stopPropagation()}
        {...(dragEnabled ? listeners : {})}
        {...(dragEnabled ? attributes : {})}
      >
        {dragEnabled && <GripHandle />}
      </td>
      <td className="w-px py-1 pl-2">
        <span
          className="block h-5 w-5 rounded-md"
          style={{ backgroundColor: timeline.color ?? 'transparent' }}
        />
      </td>
      <td className="pl-3">{timeline.title}</td>
      <td className="pl-3">{timeline.timelineType}</td>
      <td className="pl-3">{timeline.visualOrder}</td>
      <td className="w-px whitespace-nowrap">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          variant={ButtonVariant.Secondary}
        >
          EDIT
        </Button>
      </td>
      <td className="w-px whitespace-nowrap">
        <Button onClick={onDelete} variant={ButtonVariant.Secondary}>
          DELETE
        </Button>
      </td>
    </tr>
  );
}

export function TimelinesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState<'title' | 'timelineType' | 'visualOrder'>('visualOrder');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [localTimelines, setLocalTimelines] = useState<TimelineDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const dragEnabled = sortCol === 'visualOrder' && sortDir === 'asc' && searchTerm === '';

  const handleSort = (col: 'title' | 'timelineType' | 'visualOrder') => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const indicator = (col: 'title' | 'timelineType' | 'visualOrder') =>
    sortCol === col ? (
      <span style={{ fontSize: '0.7em', color: 'black' }}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
    ) : null;

  const { data: timelines, refetch: refetchTimelines } = useQuery({
    ...timelinesControllerFindAllOptions({ query: { term: searchTerm } }),
    refetchOnMount: true,
  });
  const { mutateAsync: deleteTimeline } = useMutation({ ...timelinesControllerDeleteMutation() });

  useEffect(() => {
    refetchTimelines();
  }, [location]);

  useEffect(() => {
    setLocalTimelines(timelines ?? []);
  }, [timelines]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const sortedTimelines = orderBy(
    localTimelines,
    (t) => (sortCol === 'title' ? t.title?.toLowerCase() : t[sortCol]),
    sortDir
  );

  const activeTimeline = activeId ? sortedTimelines.find((t) => t.id === activeId) ?? null : null;

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string);
  };

  const handleDragOver = ({ over }: DragOverEvent) => {
    setOverId((over?.id as string) ?? null);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = localTimelines.findIndex((t) => t.id === active.id);
    const newIndex = localTimelines.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(localTimelines, oldIndex, newIndex);
    const payload = reordered.map((t, i) => ({ id: t.id, visualOrder: i }));

    setLocalTimelines(reordered.map((t, i) => ({ ...t, visualOrder: i })));

    try {
      await reorderTimelinesApi(payload);
      await refetchTimelines();
    } catch {
      toast('Failed to save new order', { type: 'error' });
      setLocalTimelines(timelines ?? []);
    }
  };

  return (
    <div className="p-timelines">
      <PageHeader
        title="Timelines"
        description="Manages the lanes you see on the main timeline overview page. Timelines show you what events or programs were open at what time. You can also configure a timeline for tagging time and even an auto tagging timeline that uses rules to auto tag time."
      >
        <Button
          onClick={() =>
            navigate(
              '/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.timelines + '/' + ROUTE_PARTS.create
            )
          }
          variant={ButtonVariant.Primary}
        >
          Add timeline
        </Button>
      </PageHeader>
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        className="mb-3 ml-4 w-full max-w-sm"
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedTimelines.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="c-table w-full">
            <thead>
              <tr className="h-10 bg-white">
                <th className="w-px" />
                <th className="w-px" />
                <th
                  className="text-left pl-3 cursor-pointer select-none"
                  onClick={() => handleSort('title')}
                >
                  Title{indicator('title')}
                </th>
                <th
                  className="text-left pl-3 cursor-pointer select-none"
                  onClick={() => handleSort('timelineType')}
                >
                  Type{indicator('timelineType')}
                </th>
                <th
                  className="text-left pl-3 cursor-pointer select-none"
                  onClick={() => handleSort('visualOrder')}
                >
                  Order{indicator('visualOrder')}
                </th>
                <th className="w-px whitespace-nowrap" />
                <th className="w-px whitespace-nowrap" />
              </tr>
            </thead>
            <tbody>
              {sortedTimelines.map(
                (timeline): ReactNode => (
                  <SortableTimelineRow
                    key={'timeline-' + timeline.id}
                    timeline={timeline}
                    dragEnabled={dragEnabled}
                    activeId={activeId}
                    overId={overId}
                    sortedList={sortedTimelines}
                    onEdit={() =>
                      navigate(
                        '/' +
                          ROUTE_PARTS.manage +
                          '/' +
                          ROUTE_PARTS.timelines +
                          '/' +
                          timeline.id +
                          '/' +
                          ROUTE_PARTS.edit
                      )
                    }
                    onDelete={async (e) => {
                      e.stopPropagation();
                      if (timeline.id) {
                        await deleteTimeline({ path: { id: timeline.id } });
                        await refetchTimelines();
                        toast('Timeline has been deleted', { type: 'success' });
                      } else {
                        toast('Timeline could not be deleted, no id has been set', {
                          type: 'warning',
                        });
                      }
                    }}
                  />
                )
              )}
            </tbody>
          </table>
        </SortableContext>
        <DragOverlay>
          {activeTimeline && <TimelineDragOverlay timeline={activeTimeline} />}
        </DragOverlay>
      </DndContext>

      <Outlet />
    </div>
  );
}
