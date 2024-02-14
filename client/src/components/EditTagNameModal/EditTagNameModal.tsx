import './EditTagNameModal.scss';

import React, { ChangeEvent, useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { COLOR_LIST } from '../../views/TimelinesPage/TimelinesPage.consts';
import { TagName } from '../../types/types';
import { ROUTE_PARTS } from '../../App';
import {
  useAutoTagsServiceAutoTagsControllerFindOne,
  useAutoTagsServiceAutoTagsControllerFindOneKey,
  useTagNamesServiceTagNamesControllerCreate,
  useTagNamesServiceTagNamesControllerFindOne,
  useTagNamesServiceTagNamesControllerUpdate,
  useTagsServiceTagsControllerFindOne,
} from '../../generated/api/queries';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ColorInput } from '../ColorInput/ColorInput';

function EditTagNameModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>(COLOR_LIST[0]);
  const { mutateAsync: createTagName } = useTagNamesServiceTagNamesControllerCreate();
  const { mutateAsync: updateTagName } = useTagNamesServiceTagNamesControllerUpdate();
  const { data: tagNameResponse } = useTagNamesServiceTagNamesControllerFindOne(
    { id: id as string },
    [useAutoTagsServiceAutoTagsControllerFindOneKey, id as string],
    { enabled: !!id }
  );
  const tagName = tagNameResponse as TagName;

  useEffect(() => {
    if (tagName) {
      setName(tagName.name);
      setColor(tagName.color);
    }
  }, [tagName]);

  const handleClose = () => navigate('/' + ROUTE_PARTS.tagNames);

  const handleSave = async (tagName: Omit<TagName, 'id'>) => {
    if (id) {
      await updateTagName({
        id,
        requestBody: {
          name: tagName.name,
          color: tagName.color,
        },
      });

      toast('Tag name has been updated', {
        type: 'success',
      });
    } else {
      await createTagName({
        requestBody: {
          name: tagName.name,
          color: tagName.color,
        },
      });

      toast('Tag name has been created', {
        type: 'success',
      });
    }

    handleClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-edit-tag-name-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Update tag name' : 'Add tag name'}</h3>

      <h4 className="mt-4">Name</h4>
      <input
        className="c-input"
        value={name}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setName(evt.target?.value)}
      />

      <h4 className="mt-4">Color</h4>
      <ColorInput color={color} onChange={setColor} />

      <div className="flex flex-row justify-end gap-2 mt-48">
        <button className="c-button" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="c-button"
          disabled={!name || !color}
          onClick={async () => {
            await handleSave({
              name,
              color,
            });
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

export default EditTagNameModal;
