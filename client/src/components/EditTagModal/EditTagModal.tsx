import './EditTagModal.css';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { Pencil } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import type {
  TagDto,
  TagNameDto,
  TimelinesControllerFindAllEventsResponse,
} from '../../generated/api/types.gen';
import type { TagName } from '../../types/types';

import { ROUTE_PARTS } from '../../App';
import {
  tagNamesControllerCreateMutation,
  tagNamesControllerFindOneOptions,
  tagsControllerCreateMutation,
  tagsControllerFindOneOptions,
  tagsControllerRemoveMutation,
  tagsControllerUpdateMutation,
  timelinesControllerFindAllEventsOptions,
  timelinesControllerFindAllEventsQueryKey,
} from '../../generated/api/@tanstack/react-query.gen';
import { getOverlappingAutoTagNotes } from '../../helpers/get-overlapping-auto-tag-notes';
import Button, { ButtonSize, ButtonVariant } from '../Button/Button';
import TagSelectSingle from '../TagSelect/TagSelectSingle';
import { getRandomColor } from '../Timeline/helpers/getColorForEvent';

export function EditTagModal() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const paramStartedAt = !uuid ? searchParams.get('startedAt') : null;
  const paramEndedAt = !uuid ? searchParams.get('endedAt') : null;

  const [selectedTagName, setSelectedTagName] = useState<TagName | null>(null);
  const [startedAt, setStartedAt] = useState(
    paramStartedAt ? format(parseISO(paramStartedAt), "yyyy-MM-dd'T'HH:mm:ss") : ''
  );
  const [endedAt, setEndedAt] = useState(
    paramEndedAt ? format(parseISO(paramEndedAt), "yyyy-MM-dd'T'HH:mm:ss") : ''
  );
  const [note, setNote] = useState('');

  const { data: tag } = useQuery({
    ...tagsControllerFindOneOptions({ path: { id: uuid as string } }),
    enabled: !!uuid,
  });

  const { data: tagName } = useQuery({
    ...tagNamesControllerFindOneOptions({
      path: { id: (tag as TagDto)?.tagNameId as string },
    }),
    enabled: !!(tag as TagDto)?.tagNameId,
  });

  // When creating a tag for a time range, load that day so the notes of the
  // overlapping auto tags can be copied into the note field
  const { data: dayTimelinesWithEvents } = useQuery({
    ...timelinesControllerFindAllEventsOptions({
      query: {
        startedAt: startOfDay(parseISO(paramStartedAt || new Date().toISOString())).toISOString(),
        endedAt: endOfDay(parseISO(paramStartedAt || new Date().toISOString())).toISOString(),
      },
    }),
    enabled: !uuid && !!paramStartedAt && !!paramEndedAt,
  });

  const { mutateAsync: createTagName } = useMutation({ ...tagNamesControllerCreateMutation() });
  const { mutateAsync: createTag } = useMutation({ ...tagsControllerCreateMutation() });
  const { mutateAsync: updateTag } = useMutation({ ...tagsControllerUpdateMutation() });
  const { mutateAsync: deleteTag } = useMutation({ ...tagsControllerRemoveMutation() });

  useEffect(() => {
    if (tag) {
      const t = tag as TagDto;
      setStartedAt(t.startedAt ? format(parseISO(t.startedAt), "yyyy-MM-dd'T'HH:mm:ss") : '');
      setEndedAt(t.endedAt ? format(parseISO(t.endedAt), "yyyy-MM-dd'T'HH:mm:ss") : '');
      setNote(t.note ?? '');
    }
  }, [tag]);

  useEffect(() => {
    if (tagName) {
      setSelectedTagName(tagName as unknown as TagName);
    }
  }, [tagName]);

  useEffect(() => {
    if (uuid || !dayTimelinesWithEvents || !paramStartedAt || !paramEndedAt) return;
    const autoTagNotes = getOverlappingAutoTagNotes(
      dayTimelinesWithEvents,
      parseISO(paramStartedAt),
      parseISO(paramEndedAt)
    );
    if (!autoTagNotes.length) return;
    // Never overwrite what the user already typed
    setNote((currentNote) => currentNote || autoTagNotes.join(', '));
  }, [uuid, dayTimelinesWithEvents, paramStartedAt, paramEndedAt]);

  const handleClose = () => navigate('/' + ROUTE_PARTS.timelinesAndEvents);

  const handleSave = async () => {
    if (!selectedTagName?.title || !startedAt || !endedAt) {
      toast('Please fill in all fields', { type: 'warning' });
      return;
    }

    let tagNameId = selectedTagName.id;

    if ((selectedTagName as TagName & { __isNew__?: boolean }).__isNew__) {
      const created = await createTagName({
        body: { title: selectedTagName.title, code: '', color: getRandomColor() },
      });
      tagNameId = (created as TagNameDto as unknown as TagName).id;
    }

    const body = {
      tagNameId,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      note: note || undefined,
    };

    if (uuid) {
      const queryKey = timelinesControllerFindAllEventsQueryKey({
        query: {
          startedAt: startOfDay(new Date(startedAt)).toISOString(),
          endedAt: endOfDay(new Date(startedAt)).toISOString(),
        },
      });

      // Cancel any in-flight refetches so they don't overwrite the optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the current data for rollback on error
      const previousData =
        queryClient.getQueryData<TimelinesControllerFindAllEventsResponse>(queryKey);

      // Patch the cache right away so the modal can close instantly
      queryClient.setQueryData<TimelinesControllerFindAllEventsResponse>(queryKey, (old) => {
        if (!old) return old;
        return old.map((timeline) => ({
          ...timeline,
          events: timeline.events.map((event) =>
            event.id === uuid
              ? {
                  ...event,
                  startedAt: body.startedAt,
                  endedAt: body.endedAt,
                  info: { ...event.info, note: body.note ?? null },
                }
              : event
          ),
        }));
      });

      // Close right away, the mutation continues in the background
      handleClose();

      try {
        await updateTag({ path: { id: uuid }, body });
        toast('Tag has been updated', { type: 'success' });
      } catch {
        // Roll back the optimistic update if the save failed
        queryClient.setQueryData(queryKey, previousData);
        toast('Tag could not be updated', { type: 'error' });
      }

      await queryClient.invalidateQueries({
        predicate: (query) =>
          (query.queryKey[0] as { _id?: string })?._id === 'timelinesControllerFindAllEvents',
      });
      return;
    }

    await createTag({ body });
    toast('Tag has been created', { type: 'success' });

    await queryClient.invalidateQueries({
      predicate: (query) =>
        (query.queryKey[0] as { _id?: string })?._id === 'timelinesControllerFindAllEvents',
    });
    handleClose();
  };

  const handleDelete = async () => {
    await deleteTag({ path: { id: uuid as string } });
    toast('Tag has been deleted', { type: 'success' });
    await queryClient.invalidateQueries({
      predicate: (query) =>
        (query.queryKey[0] as { _id?: string })?._id === 'timelinesControllerFindAllEvents',
    });
    handleClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-edit-tag-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{uuid ? 'Edit tag' : 'Create tag'}</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="c-form">
          <label>Tag name</label>
          <div className="flex flex-row gap-2 items-center">
            <div className="flex-1">
              <TagSelectSingle
                value={selectedTagName}
                onChange={setSelectedTagName}
                autoFocus={true}
              />
            </div>
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Small}
              icon={<Pencil size={14} />}
              disabled={!selectedTagName}
              title="Edit tag name"
              onClick={() =>
                navigate(
                  `/${ROUTE_PARTS.manage}/${ROUTE_PARTS.tagNames}/${selectedTagName!.id}/${ROUTE_PARTS.edit}`
                )
              }
            />
          </div>

          <label>Start time</label>
          <input
            className="c-input"
            type="datetime-local"
            step="1"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
          />

          <label>End time</label>
          <input
            className="c-input"
            type="datetime-local"
            step="1"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
          />

          <label>Note</label>
          <textarea
            className="c-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex flex-row justify-between gap-2 mt-8">
          <div>
            {uuid && (
              <Button
                onClick={handleDelete}
                className="!bg-red-100 !text-red-700 hover:!bg-red-200"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex flex-row gap-2">
            <Button onClick={handleClose} variant={ButtonVariant.Secondary}>
              Cancel
            </Button>
            <Button type="submit" variant={ButtonVariant.Primary}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
