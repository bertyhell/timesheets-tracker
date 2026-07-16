import './EditAutoTagModal.css';

import { cloneDeep } from 'lodash-es';
import React, { type ChangeEvent, useEffect, useState } from 'react';
import Button, { ButtonVariant } from '../Button/Button';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { ROUTE_PARTS } from '../../App';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  autoTagsControllerCountOptions,
  autoTagsControllerCreateMutation,
  autoTagsControllerDeleteMutation,
  autoTagsControllerFindOneOptions,
  autoTagsControllerUpdateMutation,
  tagNamesControllerCreateMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import type { CreateAutoTagDto, UpdateAutoTagsDto } from '../../generated/api/types.gen';
import {
  type AutoTag,
  type AutoTagCondition,
  BooleanOperator,
  ConditionOperator,
  ConditionVariable,
  type TagName,
} from '../../types/types';
import AutoTagConditionInput from '../AutoTagCondition/AutoTagConditionInput';
import TagSelectSingle from '../TagSelect/TagSelectSingle';
import { getRandomColor } from '../Timeline/helpers/getColorForEvent';
import type { TagNameDto } from '../../generated/api/types.gen';

const NEW_CONDITION: AutoTagCondition = {
  booleanOperator: BooleanOperator.OR,
  variable: ConditionVariable.anyVariable,
  operator: ConditionOperator.contains,
  value: '',
};

function parsePrefillConditions(raw: string | null): AutoTagCondition[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((entry): entry is { variable?: string; value?: string } => !!entry?.value)
    .map((entry) => ({
      ...NEW_CONDITION,
      variable:
        entry.variable && (Object.values(ConditionVariable) as string[]).includes(entry.variable)
          ? (entry.variable as ConditionVariable)
          : NEW_CONDITION.variable,
      value: entry.value as string,
    }));
}

export function EditAutoTagModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState<string>('');
  const [selectedTagName, setSelectedTagName] = useState<TagName | null>(null);
  const [_priority, setPriority] = useState<number>(0); // TODO allow drag and drop

  const prefillConditions = parsePrefillConditions(!id ? searchParams.get('conditions') : null);

  const [conditions, setConditions] = useState<AutoTagCondition[]>(
    prefillConditions.length
      ? [...prefillConditions, NEW_CONDITION]
      : [NEW_CONDITION, NEW_CONDITION]
  );
  const [userModifiedName, setUserModifiedName] = useState<boolean>(false);
  const { data: autoTagsCount } = useQuery({ ...autoTagsControllerCountOptions() });
  const { data: autoTagResponse } = useQuery({
    ...autoTagsControllerFindOneOptions({ path: { id: id as string } }),
    enabled: !!id,
  });
  const autoTag = autoTagResponse as AutoTag;
  const { mutateAsync: createAutoTag } = useMutation({ ...autoTagsControllerCreateMutation() });
  const { mutateAsync: updateAutoTag } = useMutation({ ...autoTagsControllerUpdateMutation() });
  const { mutateAsync: deleteAutoTag } = useMutation({ ...autoTagsControllerDeleteMutation() });
  const { mutateAsync: createTagName } = useMutation({ ...tagNamesControllerCreateMutation() });

  useEffect(() => {
    if (autoTag) {
      setName(autoTag.title);
      setUserModifiedName(true);
      if (autoTag.tagName) {
        setSelectedTagName(autoTag.tagName);
      }
      setPriority(autoTag.priority);
      if (autoTag.conditions?.length !== 0) {
        setConditions(autoTag.conditions);
      }
    }
  }, [autoTag]);

  useEffect(() => {
    const lastCondition = conditions.at(-1);
    if (!lastCondition) {
      return;
    }
    if (lastCondition.variable && lastCondition.operator && lastCondition.value) {
      setConditions([...conditions, { ...NEW_CONDITION }]);
    }
  }, [conditions]);

  const handleChangeCondition = (
    i: number,
    booleanOperator: BooleanOperator,
    variable: ConditionVariable | null,
    operator: ConditionOperator | null,
    value: string
  ) => {
    const newConditions = cloneDeep(conditions);
    newConditions[i] = {
      booleanOperator,
      variable,
      operator,
      value,
    };
    setConditions(newConditions);
  };

  const handleDeleteCondition = (conditionIndex: number) => {
    const newConditions = cloneDeep(conditions);
    newConditions.splice(conditionIndex, 1);
    setConditions(newConditions);
  };

  const handleClose = () => navigate('/' + ROUTE_PARTS.manage + '/' + ROUTE_PARTS.autoTagRules);

  const handleSave = async () => {
    if (!selectedTagName?.id) {
      toast('Please select a tag', { type: 'warning' });
      return;
    }

    const tagNameId = selectedTagName.id;

    const updatedAutoTag: Omit<AutoTag, 'id'> & { id?: string } = {
      tagNameId,
      title: name,
      priority: autoTagsCount?.count || 0,
      conditions: conditions.filter((condition) => !!condition.value),
    };
    if (id) {
      // edit existing auto tag
      updatedAutoTag.id = autoTag.id;
      await updateAutoTag({
        path: { id: autoTag.id },
        body: updatedAutoTag as UpdateAutoTagsDto,
      });
      toast('Auto tag has been updated', { type: 'success' });
    } else {
      // create new auto tag
      await createAutoTag({
        body: updatedAutoTag as CreateAutoTagDto,
      });
      toast('Auto tag has been created', { type: 'success' });
    }

    handleClose();
  };

  const handleDelete = async () => {
    await deleteAutoTag({ path: { id: id as string } });
    toast('Auto tag has been deleted', { type: 'success' });
    handleClose();
  };

  const handleTagCreate = async (inputValue: string) => {
    const created = await createTagName({
      body: { title: inputValue, code: '', color: getRandomColor() },
    });
    const newTag = created as TagNameDto as unknown as TagName;
    setSelectedTagName(newTag);
    if (!userModifiedName) setName(newTag.title || '');
  };

  const handleTagChanged = async (option: (TagName | null)) => {
    if (!option) {
      setSelectedTagName(null);
      if (!userModifiedName) setName('');
      return;
    }
    if ((option as TagName & { __isNew__?: boolean }).__isNew__) {
      const created = await createTagName({
        body: { title: option.title, code: '', color: getRandomColor() },
      });
      const newTag = created as TagNameDto as unknown as TagName;
      setSelectedTagName(newTag);
      if (!userModifiedName) setName(newTag.title || '');
    } else {
      setSelectedTagName(option);
      if (!userModifiedName) setName(option.title || '');
    }
  }

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-edit-auto-tag-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Edit auto tag' : 'Add auto tag'}</h3>

      <div className="c-form">
        <label>Tag name</label>
        <div className="flex flex-row items-center gap-2">
          <div className="w-2/3">
            <TagSelectSingle
              value={selectedTagName || null}
              onChange={handleTagChanged}
              onCreateOption={handleTagCreate}
              autoFocus={true}
            />
          </div>
          {selectedTagName?.id && (
            <a
              href={`/${ROUTE_PARTS.manage}/${ROUTE_PARTS.tagNames}/${selectedTagName.id}/${ROUTE_PARTS.edit}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-800 whitespace-nowrap text-sm"
            >
              Open tag
            </a>
          )}
        </div>

        <label>Auto tag Name</label>
        <input
          className="c-input"
          value={name}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => {
            setUserModifiedName(true);
            setName(evt.target.value);
          }}
        />

        <label>Conditions</label>
        <div>
          {!!conditions &&
            conditions.map((condition, i) => (
              <AutoTagConditionInput
                key={'auto-tag-condition__' + i}
                index={i}
                showBooleanOperator={i !== 0}
                {...conditions[i]}
                onChange={(booleanOperator, variable, operator, value) =>
                  handleChangeCondition(i, booleanOperator, variable, operator, value)
                }
                onDelete={handleDeleteCondition}
                showDelete={conditions.length > 1}
              ></AutoTagConditionInput>
            ))}
        </div>
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
          <Button onClick={handleSave} variant={ButtonVariant.Primary}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
