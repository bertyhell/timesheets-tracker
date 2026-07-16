import './AutoTagsPage.css';
import { Modal } from 'react-responsive-modal';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  autoTagsControllerCreateMutation,
  autoTagsControllerDeleteMutation,
  autoTagsControllerFindAllOptions,
  autoTagsControllerUpdateMutation,
} from '../../../generated/api/@tanstack/react-query.gen';
import React, { type ReactNode, useCallback, useEffect, useState } from 'react';
import { orderBy } from 'lodash-es';
import { ROUTE_PARTS } from '../../../App';
import { toast } from 'react-toastify';
import { type AutoTag } from '../../../types/types';
import copy from 'copy-to-clipboard';
import { mapLimit } from 'blend-promise-utils';
import type { AutoTagConditionDto, AutoTagDto } from '../../../generated/api/types.gen';
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
import { GripHandle } from '../../../components/GripHandle/GripHandle';
import { reorderAutoTags as reorderAutoTagsApi } from '../../../api/reorder';

const AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION = 'timesheetTrackerAutoTags';

function AutoTagDragOverlay({ autoTag }: { autoTag: AutoTagDto }) {
  return (
    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', boxShadow: '0 4px 16px rgba(0,0,0,0.18)', background: 'white', opacity: 0.95 }}>
      <tbody>
        <tr>
          <td style={{ width: 28, paddingLeft: 8, color: '#888' }}><GripHandle /></td>
          <td style={{ width: 28, paddingLeft: 8 }}>
            <span style={{ display: 'block', height: 20, width: 20, borderRadius: 6, backgroundColor: autoTag.tagName?.color }} />
          </td>
          <td style={{ paddingLeft: 12 }}>{autoTag.title}</td>
          <td style={{ paddingLeft: 12 }}>{autoTag.priority}</td>
          <td /><td />
        </tr>
      </tbody>
    </table>
  );
}

function SortableAutoTagRow({
  autoTag,
  dragEnabled,
  activeId,
  overId,
  sortedList,
  onEdit,
  onDelete,
}: {
  autoTag: AutoTagDto;
  dragEnabled: boolean;
  activeId: string | null;
  overId: string | null;
  sortedList: AutoTagDto[];
  onEdit: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: autoTag.id });

  const activeIndex = sortedList.findIndex((t) => t.id === activeId);
  const overIndex = sortedList.findIndex((t) => t.id === overId);
  const isOver = overId === autoTag.id && activeId !== autoTag.id;
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
          style={{ backgroundColor: autoTag.tagName?.color }}
        />
      </td>
      <td className="pl-3">{autoTag.title}</td>
      <td className="pl-3">{autoTag.priority}</td>
      <td className="w-px whitespace-nowrap">
        <Button
          variant={ButtonVariant.Secondary}
          to={
            '/' +
            ROUTE_PARTS.manage +
            '/' +
            ROUTE_PARTS.autoTagRules +
            '/' +
            autoTag.id +
            '/' +
            ROUTE_PARTS.edit
          }
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
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

export function AutoTagsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState<'title' | 'priority'>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [localAutoTags, setLocalAutoTags] = useState<AutoTagDto[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [mergeGroups, setMergeGroups] = useState<AutoTagDto[][] | null>(null);

  const dragEnabled = sortCol === 'priority' && sortDir === 'asc' && searchTerm === '';

  const toggleSort = (col: 'title' | 'priority') => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sortIndicator = (col: 'title' | 'priority') =>
    sortCol === col ? (
      <span style={{ fontSize: '0.7em', color: 'black' }}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
    ) : (
      <span style={{ fontSize: '0.7em', color: '#aaa' }}> ▲▼</span>
    );

  const { data: autoTagItems, refetch: refetchAutoTags } = useQuery({
    ...autoTagsControllerFindAllOptions({ query: { term: searchTerm } }),
  });
  const { mutateAsync: insertAutoTag } = useMutation({ ...autoTagsControllerCreateMutation() });
  const autoTags = autoTagItems as AutoTagDto[];
  const { mutateAsync: deleteAutoTag } = useMutation({ ...autoTagsControllerDeleteMutation() });
  const { mutateAsync: updateAutoTag } = useMutation({ ...autoTagsControllerUpdateMutation() });

  useEffect(() => {
    refetchAutoTags();
  }, [location]);

  useEffect(() => {
    setLocalAutoTags((autoTagItems as AutoTagDto[]) ?? []);
  }, [autoTagItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const sortedAutoTags = orderBy(
    localAutoTags,
    (autoTag) => (sortCol === 'title' ? autoTag.title?.toLowerCase() : autoTag.priority),
    sortDir
  );

  const activeAutoTag = activeId ? sortedAutoTags.find((t) => t.id === activeId) ?? null : null;

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

    const oldIndex = localAutoTags.findIndex((t) => t.id === active.id);
    const newIndex = localAutoTags.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(localAutoTags, oldIndex, newIndex);
    const payload = reordered.map((t, i) => ({ id: t.id, priority: i }));

    setLocalAutoTags(reordered.map((t, i) => ({ ...t, priority: i })));

    try {
      await reorderAutoTagsApi(payload);
      await refetchAutoTags();
    } catch {
      toast('Failed to save new order', { type: 'error' });
      setLocalAutoTags(autoTags ?? []);
    }
  };

  const handlePasteAutoTags = async (pastedAutoTags: AutoTag[]) => {
    await mapLimit(pastedAutoTags, 5, async (pastedAutoTag: AutoTag) => {
      return await insertAutoTag({
        body: {
          title: pastedAutoTag.title,
          priority: pastedAutoTag.priority,
          tagNameId: pastedAutoTag.tagNameId,
          conditions: pastedAutoTag.conditions as AutoTagConditionDto[],
        },
      });
    });
    await refetchAutoTags();
    toast(pastedAutoTags.length + ' auto tags were added');
  };

  const onPasteContent = useCallback(
    async (evt: ClipboardEvent) => {
      const mainRoute = '/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.autoTagRules;
      if (location.pathname !== mainRoute) {
        return;
      }

      try {
        if (evt.clipboardData && evt.clipboardData.getData) {
          const pastedText = evt.clipboardData.getData('text/plain');

          if (pastedText.includes(AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION)) {
            await handlePasteAutoTags(
              JSON.parse(pastedText)[AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION]
            );
          } else {
            toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
          }
        }
      } catch {
        toast("The pasted text doesn't contain any valid auto tags", { type: 'error' });
      }
    },
    [location.pathname]
  );

  useEffect(() => {
    document.body.addEventListener('paste', onPasteContent);

    return () => {
      document.body.removeEventListener('paste', onPasteContent);
    };
  }, [onPasteContent]);

  const handleMergeDuplicates = () => {
    const grouped = new Map<string, AutoTagDto[]>();
    for (const tag of autoTags ?? []) {
      if (!tag.tagNameId) continue;
      if (!grouped.has(tag.tagNameId)) grouped.set(tag.tagNameId, []);
      grouped.get(tag.tagNameId)!.push(tag);
    }

    const duplicateGroups = Array.from(grouped.values()).filter((g) => g.length > 1);

    if (duplicateGroups.length === 0) {
      toast('No duplicate tag names found', { type: 'info' });
      return;
    }

    setMergeGroups(duplicateGroups);
  };

  const confirmMerge = async () => {
    if (!mergeGroups) return;

    for (const group of mergeGroups) {
      const sorted = orderBy(group, 'priority', 'asc');
      const [base, ...rest] = sorted;

      const mergedConditions: AutoTagConditionDto[] = [...(base.conditions ?? [])];
      for (const tag of rest) {
        const conditions = tag.conditions ?? [];
        conditions.forEach((cond, i) => {
          mergedConditions.push(i === 0 ? { ...cond, booleanOperator: 'OR' } : cond);
        });
      }

      await updateAutoTag({ path: { id: base.id }, body: { conditions: mergedConditions } });
      for (const tag of rest) {
        await deleteAutoTag({ path: { id: tag.id } });
      }
    }

    setMergeGroups(null);
    await refetchAutoTags();
    toast(`Merged ${mergeGroups.length} duplicate tag group(s)`, { type: 'success' });
  };

  const copyAutoTagsToClipboard = () => {
    copy(JSON.stringify({ [AUTOTAGS_PROPERTY_NAME_FOR_PASTE_DETECTION]: autoTagItems }, null, 2));
    toast('Auto tag copied to clipboard', { type: 'success' });
  };

  return (
    <div>
      <PageHeader
        title="Auto tag rules"
        description="Auto tag rules allow you to automatically tag time on a timeline using rules. You can create rules based on other timeline events to automatically tag time. For example, you can create a rule that tags time for a specific customer when a specific program is open or when you have a calendar meeting with a certain person."
      >
        <div className="flex flex-row gap-2" style={{ flexWrap: 'wrap' }}>
          <Button
            onClick={() =>
              navigate(
                '/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.autoTagRules + '/' + ROUTE_PARTS.create
              )
            }
            variant={ButtonVariant.Primary}
          >
            Add auto tag
          </Button>
          <Button onClick={handleMergeDuplicates} variant={ButtonVariant.Transparent}>
            Merge duplicates
          </Button>
          <Button onClick={copyAutoTagsToClipboard} variant={ButtonVariant.Transparent}>
            Copy autotags
          </Button>
        </div>
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
          items={sortedAutoTags.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="c-table w-full">
            <thead>
              <tr className="h-10 bg-white">
                <th className="w-px" />
                <th className="w-px" />
                <th
                  className="text-left pl-3 cursor-pointer select-none"
                  onClick={() => toggleSort('title')}
                >
                  Title{sortIndicator('title')}
                </th>
                <th
                  className="text-left pl-3 cursor-pointer select-none"
                  onClick={() => toggleSort('priority')}
                >
                  Priority{sortIndicator('priority')}
                </th>
                <th className="w-px whitespace-nowrap" />
                <th className="w-px whitespace-nowrap" />
              </tr>
            </thead>
            <tbody>
              {sortedAutoTags.map(
                (autoTag: AutoTagDto): ReactNode => (
                  <SortableAutoTagRow
                    key={'auto-tag-' + autoTag.id}
                    autoTag={autoTag}
                    dragEnabled={dragEnabled}
                    activeId={activeId}
                    overId={overId}
                    sortedList={sortedAutoTags}
                    onEdit={() =>
                      navigate(
                        '/' +
                          ROUTE_PARTS.manage +
                          '/' +
                          ROUTE_PARTS.autoTagRules +
                          '/' +
                          autoTag.id +
                          '/' +
                          ROUTE_PARTS.edit
                      )
                    }
                    onDelete={async (e) => {
                      e.stopPropagation();
                      if (autoTag.id) {
                        await deleteAutoTag({ path: { id: autoTag.id } });
                        await refetchAutoTags();
                        toast('Auto tag has been deleted', { type: 'success' });
                      } else {
                        toast("Cannot delete an auto tag since it doesn't have an id", {
                          type: 'error',
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
          {activeAutoTag && <AutoTagDragOverlay autoTag={activeAutoTag} />}
        </DragOverlay>
      </DndContext>
      {mergeGroups && (
        <Modal
          open
          onClose={() => setMergeGroups(null)}
          classNames={{ modal: 'c-modal', closeButton: 'c-button c-button--small' }}
        >
          <h3>Merge duplicate tag rules</h3>
          <p className="text-gray-500 mt-1 mb-4" style={{ fontSize: '0.85em' }}>
            The following tag names have multiple rules. They will be merged into one rule per tag,
            with conditions joined by OR between each original rule.
          </p>
          <ul className="mb-6" style={{ paddingLeft: '1.25rem', listStyle: 'disc' }}>
            {mergeGroups.map((group) => (
              <li key={group[0].tagNameId}>
                <strong>{group[0].tagName?.name ?? group[0].tagNameId}</strong>
                {' — '}{group.length} rules
              </li>
            ))}
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant={ButtonVariant.Secondary} onClick={() => setMergeGroups(null)}>
              Cancel
            </Button>
            <Button variant={ButtonVariant.Primary} onClick={confirmMerge}>
              Merge
            </Button>
          </div>
        </Modal>
      )}
      <Outlet />
    </div>
  );
}
