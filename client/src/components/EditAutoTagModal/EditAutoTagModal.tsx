import './EditAutoTagModal.scss';

import { cloneDeep } from 'lodash-es';
import React, { type ChangeEvent, useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { ROUTE_PARTS } from '../../App';
import {
  useAutoTagsServiceAutoTagsControllerCount,
  useAutoTagsServiceAutoTagsControllerCreate,
  useAutoTagsServiceAutoTagsControllerFindOne,
  useAutoTagsServiceAutoTagsControllerFindOneKey,
  useAutoTagsServiceAutoTagsControllerUpdate,
  useTagNamesServiceTagNamesControllerCreate,
} from '../../generated/api/queries';
import { CreateAutoTagDto, UpdateAutoTagsDto } from '../../generated/api/requests';
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
import ToggleButton from '../ToggleButton/ToggleButton';
import { COLOR_LIST } from '../Timeline/helpers/getColorForEvent';

const NEW_CONDITION: AutoTagCondition = {
  booleanOperator: BooleanOperator.OR,
  variable: ConditionVariable.anyVariable,
  operator: ConditionOperator.contains,
  value: '',
};

function EditAutoTagModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState<string>('');
  const [selectedTagName, setSelectedTagName] = useState<TagName | null>(null);
  const [_priority, setPriority] = useState<number>(0); // TODO allow drag and drop
  const [conditions, setConditions] = useState<AutoTagCondition[]>([NEW_CONDITION, NEW_CONDITION]);
  const [showCreateNewTagControls, setShowCreateNewTagControls] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>('');
  const { data: autoTagsCount } = useAutoTagsServiceAutoTagsControllerCount();
  const { data: autoTagResponse } = useAutoTagsServiceAutoTagsControllerFindOne(
    { id: id as string },
    [useAutoTagsServiceAutoTagsControllerFindOneKey, id as string],
    { enabled: !!id }
  );
  const autoTag = autoTagResponse as AutoTag;
  const { mutateAsync: createAutoTag } = useAutoTagsServiceAutoTagsControllerCreate();
  const { mutateAsync: updateAutoTag } = useAutoTagsServiceAutoTagsControllerUpdate();
  const { mutateAsync: createTagName } = useTagNamesServiceTagNamesControllerCreate();

  useEffect(() => {
    if (autoTag) {
      setName(autoTag.title);
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

  const handleClose = () => navigate('/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.autoTagRules);

  const handleSave = async () => {
    // TODO add validation
    let tagNameId: string;
    if (showCreateNewTagControls) {
      // create tag and get its id
      const createdTagName = await createTagName({
        requestBody: { title: newTagName, color: COLOR_LIST[0] },
      });
      tagNameId = createdTagName.id as string;
    } else {
      tagNameId = selectedTagName?.id as string;
    }

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
        id: autoTag.id,
        requestBody: updatedAutoTag as UpdateAutoTagsDto,
      });
      toast('Auto tag has been updated', { type: 'success' });
    } else {
      // create new auto tag
      await createAutoTag({
        requestBody: updatedAutoTag as CreateAutoTagDto,
      });
      toast('Auto tag has been created', { type: 'success' });
    }

    handleClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-edit-auto-tag-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>Add auto tag</h3>

      <label>Program Tag</label>
      <ToggleButton
        optionTwoSelected={false}
        onChange={setShowCreateNewTagControls}
        label1="Existing tag"
        label2="Create new tag"
      ></ToggleButton>
      {!showCreateNewTagControls && (
        <TagSelectSingle
          value={selectedTagName || null}
          onChange={(newTagName) => {
            setSelectedTagName(newTagName);
            if (!name) {
              setName(newTagName?.title || '');
            }
          }}
          autoFocus={true}
        />
      )}
      {showCreateNewTagControls && (
        <div>
          <input
            className="c-input"
            value={newTagName}
            onChange={(evt) => setNewTagName(evt.target.value)}
            placeholder={'Name of the tag that should be created'}
          />
        </div>
      )}

      <label>Auto tag Name</label>
      <input
        className="c-input"
        value={name}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setName(evt.target?.value)}
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
      <div className="flex flex-row justify-end gap-2 mt-48">
        <button className="c-button" onClick={handleClose}>
          Cancel
        </button>
        <button className="c-button" onClick={handleSave}>
          Save
        </button>
      </div>
    </Modal>
  );
}

export default EditAutoTagModal;
