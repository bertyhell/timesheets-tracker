import './EditAutoNoteModal.css';

import React, { type ChangeEvent, useEffect, useState } from 'react';
import Button, { ButtonVariant } from '../Button/Button';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams } from 'react-router-dom';
import Select, { type ActionMeta, type OnChangeValue } from 'react-select';
import { toast } from 'react-toastify';

import * as types from '../../../../types/types';
import { ROUTE_PARTS } from '../../App';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  autoNotesControllerCreateMutation,
  autoNotesControllerFindOneOptions,
  autoNotesControllerRemoveMutation,
  autoNotesControllerUpdateMutation,
  tagNamesControllerFindAllOptions,
} from '../../generated/api/@tanstack/react-query.gen';
import { type SelectOption } from '../../helpers/select-option.types';
import { type AutoNote, ConditionVariable, type TagName } from '../../types/types';
import TagSelectMulti from '../TagSelect/TagSelectMulti';

export function EditAutoNoteModal() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [tagNames, setTagNames] = useState<TagName[]>([]);
  const [variable, setVariable] = useState<ConditionVariable>(ConditionVariable.websiteUrl);
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [extractRegex, setExtractRegex] = useState<string>('(.*)');
  const [extractRegexReplacement, setExtractRegexReplacement] = useState<string>('$1');

  const { data: tags } = useQuery({ ...tagNamesControllerFindAllOptions({ query: { term: '' } }) });
  const { mutateAsync: createNote } = useMutation({ ...autoNotesControllerCreateMutation() });
  const { mutateAsync: updateNote } = useMutation({ ...autoNotesControllerUpdateMutation() });
  const { mutateAsync: deleteNote } = useMutation({ ...autoNotesControllerRemoveMutation() });
  const { data: autoNoteResponse } = useQuery({
    ...autoNotesControllerFindOneOptions({ path: { id: id as string } }),
    enabled: !!id,
  });
  const autoNote = autoNoteResponse as AutoNote | undefined;

  const VARIABLE_LABELS: Record<types.ConditionVariable, string> = {
    [types.ConditionVariable.anyVariable]: 'any variable',
    [types.ConditionVariable.isActive]: 'activeState.isActive',
    [types.ConditionVariable.programName]: 'program.name',
    [types.ConditionVariable.windowTitle]: 'program.windowTitle',
    [types.ConditionVariable.summary]: 'calendar.summary',
    [types.ConditionVariable.description]: 'calendar.description',
    [types.ConditionVariable.location]: 'calendar.location',
    [types.ConditionVariable.allDay]: 'calendar.allDay',
    [types.ConditionVariable.websiteUrl]: 'website.url',
    [types.ConditionVariable.websiteTitle]: 'website.title',
    [types.ConditionVariable.tagNameId]: 'tag.nameId',
    [types.ConditionVariable.tagNameName]: 'tag.name',
    [types.ConditionVariable.tagNameColor]: 'tag.color',
    [types.ConditionVariable.tagNameCode]: 'tag.code',
    [types.ConditionVariable.repoName]: 'gitCommit.repoName',
    [types.ConditionVariable.commitMessage]: 'gitCommit.commitMessage',
  };

  const variableOptions: SelectOption<types.ConditionVariable>[] = Object.values(
    types.ConditionVariable
  ).map((condition) => ({ label: VARIABLE_LABELS[condition] ?? condition, value: condition }));

  useEffect(() => {
    if (autoNote) {
      setName(autoNote.title);
      setTagNames(
        (tags || []).filter(
          (tagName) => tagName.id && autoNote.tagNameIds.includes(tagName.id)
        ) as TagName[]
      );
      setVariable(autoNote.variable as ConditionVariable);
      const isRegex =
        autoNote.extractRegex !== '(.*)' || autoNote.extractRegexReplacement !== '$1';
      setUseRegex(isRegex);
      setExtractRegex(autoNote.extractRegex);
      setExtractRegexReplacement(autoNote.extractRegexReplacement);
    }
  }, [autoNote]);

  const handleClose = () => navigate('/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.notes);

  const handleSave = async (autoNote: Omit<AutoNote, 'id'>) => {
    if (id) {
      await updateNote({
        path: { id },
        body: {
          title: autoNote.title,
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
        body: {
          title: autoNote.title,
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

  const handleTagNameChange = (
    option: OnChangeValue<TagName, true> | { label: string; value: string }[],
    _actionMeta: ActionMeta<TagName>
  ) => {
    setTagNames((option as TagName[]) ?? []);
  };

  const handleDelete = async () => {
    await deleteNote({ path: { id: id as string } });
    toast('Note has been deleted', { type: 'success' });
    handleClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-edit-tag-name-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Update note' : 'Add note'}</h3>

      <p>
        Allows you to extract some information from an activity and add it as a note to a tag. Force
        instance, you can extract the jira ticket id from a url and add it as a note to the tag.
      </p>

      <h4 className="mt-4">Name</h4>

      <div className="c-form">
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
          onChange={(selectedOption: any) => {
            if (selectedOption) {
              setVariable(selectedOption?.value);
            }
          }}
          isMulti={false}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        ></Select>

        <h4 className="mt-4">Note type</h4>
        <Select<SelectOption<boolean>>
          value={
            useRegex
              ? { label: 'Extract part of text using regex', value: true }
              : { label: 'Copy full text', value: false }
          }
          options={[
            { label: 'Copy full text', value: false },
            { label: 'Extract part of text using regex', value: true },
          ]}
          onChange={(selectedOption: any) => setUseRegex(selectedOption?.value ?? false)}
          isMulti={false}
          menuPortalTarget={document.body}
          menuPosition="fixed"
          styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
        />

        {useRegex && (
          <>
            <h4 className="mt-4">Match regex</h4>
            <span>eg: jira.com/issues/(ABC-[0-9]+)</span>
            <input
              className="c-input c-edit-note__regex-input"
              value={extractRegex}
              onChange={(evt) => setExtractRegex(evt.target.value)}
            />

            <h4 className="mt-4">Extract capture group as note</h4>
            <span>eg: $1</span>
            <input
              className="c-input c-edit-note__regex-replacement-input"
              value={extractRegexReplacement}
              onChange={(evt) => setExtractRegexReplacement(evt.target.value)}
            />
          </>
        )}
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
            disabled={!name || !variable}
            onClick={async () => {
              await handleSave({
                title: name,
                tagNameIds: tagNames.map((tagName) => tagName.id),
                variable,
                extractRegex: useRegex ? extractRegex : '(.*)',
                extractRegexReplacement: useRegex ? extractRegexReplacement : '$1',
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
