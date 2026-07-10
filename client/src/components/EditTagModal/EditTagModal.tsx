import './EditTagModal.css';

import React, { useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ROUTE_PARTS } from '../../App';
import {
  tagNamesControllerFindOneOptions,
  tagsControllerCreateMutation,
  tagsControllerFindOneOptions,
  tagsControllerRemoveMutation,
  tagsControllerUpdateMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import type { TagDto } from '../../generated/api/types.gen';
import type { TagName } from '../../types/types';
import TagSelectSingle from '../TagSelect/TagSelectSingle';
import Button, { ButtonVariant } from '../Button/Button';

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

  const handleClose = () => navigate('/' + ROUTE_PARTS.timelinesAndEvents);

  const handleSave = async () => {
    if (!selectedTagName?.id || !startedAt || !endedAt) {
      toast('Please fill in all fields', { type: 'warning' });
      return;
    }

    const body = {
      tagNameId: selectedTagName.id,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(endedAt).toISOString(),
      note: note || undefined,
    };

    if (uuid) {
      await updateTag({ path: { id: uuid }, body });
      toast('Tag has been updated', { type: 'success' });
    } else {
      await createTag({ body });
      toast('Tag has been created', { type: 'success' });
    }

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
          <TagSelectSingle value={selectedTagName} onChange={setSelectedTagName} autoFocus={true} />

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
