import './EditTagNameModal.css';

import React, { type ChangeEvent, useEffect, useState } from 'react';
import Button, { ButtonVariant } from '../Button/Button';
import { Modal } from 'react-responsive-modal';
import { type TagName } from '../../types/types';
import { ROUTE_PARTS } from '../../App';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  tagNamesControllerCreateMutation,
  tagNamesControllerRemoveMutation,
  tagNamesControllerFindOneOptions,
  tagNamesControllerUpdateMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ColorInput } from '../ColorInput/ColorInput';
import { getRandomColor } from '../Timeline/helpers/getColorForEvent';

export function EditTagNameModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [color, setColor] = useState<string>(getRandomColor());
  const [note, setNote] = useState<string>('');
  const { mutateAsync: createTagName } = useMutation({ ...tagNamesControllerCreateMutation() });
  const { mutateAsync: updateTagName } = useMutation({ ...tagNamesControllerUpdateMutation() });
  const { mutateAsync: deleteTagName } = useMutation({ ...tagNamesControllerRemoveMutation() });
  const { data: tagNameResponse } = useQuery({
    ...tagNamesControllerFindOneOptions({ path: { id: id as string } }),
    enabled: !!id,
  });
  const tagName = tagNameResponse as TagName;

  useEffect(() => {
    if (tagName) {
      setName(tagName.title);
      setCode(tagName.code);
      setColor(tagName.color);
      setNote(tagName.note ?? '');
    }
  }, [tagName]);

  const handleClose = async () => {
    navigate('/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.tagNames);
  };

  const handleSave = async (tagName: Omit<TagName, 'id'>) => {
    if (id) {
      await updateTagName({
        path: { id },
        body: {
          title: tagName.title,
          code: tagName.code,
          color: tagName.color,
          note: tagName.note ?? undefined,
        },
      });

      toast('Tag name has been updated', {
        type: 'success',
      });
    } else {
      await createTagName({
        body: {
          title: tagName.title,
          code: tagName.code,
          color: tagName.color,
          note: tagName.note ?? undefined,
        },
      });

      toast('Tag name has been created', {
        type: 'success',
      });
    }

    await handleClose();
  };

  const handleDelete = async () => {
    await deleteTagName({ path: { id: id as string } });
    toast('Tag name has been deleted', { type: 'success' });
    await handleClose();
  };

  return (
    <Modal
      open={true}
      onClose={handleClose}
      classNames={{ modal: 'c-edit-tag-name-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Update tag name' : 'Add tag name'}</h3>

      <h4 className="mt-4">Name</h4>
      <div className="c-form">
        <input
          className="c-input"
          value={name}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => setName(evt.target?.value)}
        />

        <h4 className="mt-4">Code</h4>
        <input
          className="c-input"
          value={code}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => setCode(evt.target?.value)}
        />

        <h4 className="mt-4">Color</h4>
        <ColorInput color={color} onChange={setColor} />

        <h4 className="mt-4">Note</h4>
        <textarea
          className="c-input"
          value={note}
          rows={3}
          onChange={(evt: ChangeEvent<HTMLTextAreaElement>) => setNote(evt.target?.value)}
        />
      </div>

      <div className="flex flex-row justify-between gap-2 mt-48">
        <div>
          {id && (
            <Button onClick={handleDelete} className="!bg-red-100 !text-red-700 hover:!bg-red-200">
              Delete
            </Button>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Button onClick={handleClose} variant={ButtonVariant.Secondary}>
            Cancel
          </Button>
          <Button
            disabled={!name || !color}
            onClick={async () => {
              await handleSave({
                title: name,
                code,
                color,
                note: note || undefined,
              });
            }}
            variant={ButtonVariant.Primary}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
