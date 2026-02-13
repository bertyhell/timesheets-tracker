import './EditAutoNoteModal.scss';

import React, { type ChangeEvent, useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { type ActionMeta, type MultiValue, type OnChangeValue } from 'react-select';
import { toast } from 'react-toastify';

import * as types from '../../../../types/types';
import { ROUTE_PARTS } from '../../App';
import {
  useAutoNotesServiceAutoNotesControllerCreate,
  useAutoNotesServiceAutoNotesControllerFindOne,
  useAutoNotesServiceAutoNotesControllerFindOneKey,
  useAutoNotesServiceAutoNotesControllerUpdate,
  useTagNamesServiceTagNamesControllerFindAll,
} from '../../generated/api/queries';
import { type SelectOption } from '../../helpers/select-option.types';
import { type AutoNote, ConditionVariable, type TagName } from '../../types/types';
import TagSelectMulti from '../TagSelect/TagSelectMulti';

function EditAutoNoteModal() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [tagNames, setTagNames] = useState<TagName[]>([]);
  const [variable, setVariable] = useState<ConditionVariable>(ConditionVariable.websiteUrl);
  const [extractRegex, setExtractRegex] = useState<string>('(.*)');
  const [extractRegexReplacement, setExtractRegexReplacement] = useState<string>('$1');

  const { data: tags } = useTagNamesServiceTagNamesControllerFindAll({ term: '' });
  const { mutateAsync: createNote } = useAutoNotesServiceAutoNotesControllerCreate();
  const { mutateAsync: updateNote } = useAutoNotesServiceAutoNotesControllerUpdate();
  const { data: autoNoteResponse } = useAutoNotesServiceAutoNotesControllerFindOne(
    { id: id as string },
    [useAutoNotesServiceAutoNotesControllerFindOneKey, id as string],
    { enabled: !!id }
  );
  const autoNote = autoNoteResponse as AutoNote | undefined;

  const variableOptions: SelectOption<types.ConditionVariable>[] = Object.values(
    types.ConditionVariable
  ).map((condition) => ({ label: condition, value: condition }));

  useEffect(() => {
    if (autoNote) {
      setName(autoNote.name);
      setTagNames(
        (tags || []).filter(
          (tagName) => tagName.id && autoNote.tagNameIds.includes(tagName.id)
        ) as TagName[]
      );
      setVariable(autoNote.variable as ConditionVariable);
      setExtractRegex(autoNote.extractRegex);
      setExtractRegexReplacement(autoNote.extractRegexReplacement);
    }
  }, [autoNote]);

  const handleClose = () => navigate('/' + ROUTE_PARTS.notes);

  const handleSave = async (autoNote: Omit<AutoNote, 'id'>) => {
    if (id) {
      await updateNote({
        id,
        requestBody: {
          name: autoNote.name,
          tagNameIds: autoNote.tagNameIds,
          variable: autoNote.variable,
          extractRegex: autoNote.extractRegex || undefined,
          extractRegexReplacement: autoNote.extractRegexReplacement || undefined,
        },
      });

      toast('Note has been updated', {
        type: 'success',
      });
    } else {
      await createNote({
        requestBody: {
          name: autoNote.name,
          tagNameIds: autoNote.tagNameIds,
          variable: autoNote.variable,
          extractRegex: autoNote.extractRegex || undefined,
          extractRegexReplacement: autoNote.extractRegexReplacement || undefined,
        },
      });

      toast('Note has been created', {
        type: 'success',
      });
    }

    handleClose();
  };

  const handleTagNameChange = async (
    option: OnChangeValue<TagName, true> | { label: string; value: string }[],
    actionMeta: ActionMeta<TagName>
  ) => {
    if (!option) {
      return;
    }
    const tagName = (option as MultiValue<TagName>)?.[0];
    switch (actionMeta.action) {
      case 'select-option': {
        setTagNames((oldTagNames) => {
          return [...oldTagNames, (option as MultiValue<TagName>)?.[0]];
        });
        break;
      }
      case 'deselect-option': {
        setTagNames((oldTagNames) => {
          return oldTagNames.filter((tag) => tag.id === tagName?.id);
        });
        break;
      }

      case 'clear':
        setTagNames([]);
        break;
    }
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-edit-tag-name-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Update note' : 'Add note'}</h3>

      <p>
        Allows you to extract some information from an activity and add it as a note to a tag. Force instance, you can extract the jira ticket id from a url and add it as a note to the tag.
      </p>

      <h4 className="mt-4">Name</h4>
      <input
        className="c-input"
        value={name}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setName(evt.target?.value)}
      />

      <h4 className="mt-4">Tag</h4>
      <TagSelectMulti selectedValues={tagNames} onChange={handleTagNameChange} />

      <h4 className="mt-4">Note text</h4>
      <Select<SelectOption<types.ConditionVariable>>
        className="c-edit-note__variable-select"
        value={variable ? { label: variable, value: variable } : null}
        options={variableOptions}
        onChange={(selectedOption) => {
          if (selectedOption) {
            setVariable(selectedOption?.value);
          }
        }}
        isMulti={false}
      ></Select>

      <h4 className="mt-4">Note text must match regex.</h4>
      <span>eg: jira.com/issues/(ABC-[0-9]+)</span>
      <input
        className="c-input c-edit-note__regex-input"
        value={extractRegex}
        onChange={(evt) => setExtractRegex(evt.target.value)}
      />

      <h4 className="mt-4">Note text extract part of regex as note.</h4>
      <span>eg: $1</span>
      <input
        className="c-input c-edit-note__regex-replacement-input"
        value={extractRegexReplacement}
        onChange={(evt) => setExtractRegexReplacement(evt.target.value)}
      />

      <div className="flex flex-row justify-end gap-2 mt-48">
        <button className="c-button" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="c-button"
          disabled={!name || !variable}
          onClick={async () => {
            await handleSave({
              name,
              tagNameIds: tagNames.map((tagName) => tagName.id),
              variable,
              extractRegex,
              extractRegexReplacement,
            });
          }}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

export default EditAutoNoteModal;
