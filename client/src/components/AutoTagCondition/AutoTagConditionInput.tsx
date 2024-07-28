import './AutoTagConditionInput.scss';

import React from 'react';
import Select from 'react-select';
import * as types from '../../types/types';
import { type SelectOption } from '../../helpers/select-option.types'; //{ BooleanOperator, types.ConditionOperator, ConditionVariable } from '../../types/types';

interface AutoTagConditionInputProps {
  index: number;
  showBooleanOperator: boolean;
  booleanOperator: types.BooleanOperator;
  variable: types.ConditionVariable | null;
  operator: types.ConditionOperator | null;
  value: string;
  onChange: (
    booleanOperator: types.BooleanOperator,
    variable: types.ConditionVariable | null,
    operator: types.ConditionOperator | null,
    value: string
  ) => void;
  onDelete: (index: number) => void;
  showDelete: boolean;
}

function AutoTagConditionInput({
  index,
  showBooleanOperator,
  booleanOperator,
  variable,
  operator,
  value,
  onChange,
  onDelete,
  showDelete,
}: AutoTagConditionInputProps) {
  const variableOptions: SelectOption<types.ConditionVariable>[] = Object.values(
    types.ConditionVariable
  ).map((condition) => ({ label: condition, value: condition }));
  const operatorOptions: SelectOption<types.ConditionOperator>[] = Object.values(
    types.ConditionOperator
  ).map((condition) => ({ label: condition, value: condition }));
  return (
    <div
      className={
        'c-auto-tag-condition' +
        (booleanOperator === types.BooleanOperator.AND
          ? ' c-auto-tag-condition--and'
          : ' c-auto-tag-condition--or')
      }
    >
      {showBooleanOperator && (
        <button
          className="c-auto-tag-condition__boolean-operator-button c-button c-button--small"
          onClick={() =>
            onChange(
              booleanOperator === types.BooleanOperator.AND
                ? types.BooleanOperator.OR
                : types.BooleanOperator.AND,
              variable,
              operator,
              value
            )
          }
        >
          {booleanOperator}
        </button>
      )}
      <Select<SelectOption<types.ConditionVariable>>
        className="c-auto-tag-condition__variable-select"
        value={variable ? { label: variable, value: variable } : null}
        options={variableOptions}
        onChange={(selectedOption) =>
          onChange(booleanOperator, selectedOption?.value ?? null, operator, value)
        }
        isMulti={false}
      ></Select>
      <Select<SelectOption<types.ConditionOperator>>
        className="c-auto-tag-condition__operator-select"
        value={operator ? { label: operator, value: operator } : null}
        options={operatorOptions}
        onChange={(selectedOption) =>
          onChange(booleanOperator, variable, selectedOption?.value ?? null, value)
        }
        isMulti={false}
      ></Select>
      <input
        className="c-input c-auto-tag-condition__value-input"
        value={value}
        onChange={(evt) => onChange(booleanOperator, variable, operator, evt.target.value)}
      />
      {showDelete && (
        <button className="c-button c-button--small" onClick={() => onDelete(index)}>
          delete
        </button>
      )}
    </div>
  );
}

export default AutoTagConditionInput;
