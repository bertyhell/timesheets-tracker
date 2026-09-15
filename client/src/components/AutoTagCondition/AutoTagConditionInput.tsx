import './AutoTagConditionInput.css';

import { Trash2Icon } from 'lucide-react';
import React from 'react';
import Select, { type GroupBase, type StylesConfig } from 'react-select';

import { checkRegex } from '../../helpers/check-regex';
import { type SelectOption } from '../../helpers/select-option.types';
import * as types from '../../types/types';
import {
  CONDITION_OPERATOR_OPTIONS,
  CONDITION_VARIABLE_GROUPS,
  conditionOperatorLabel,
  conditionVariableLabel,
  isRegexOperator,
} from './conditionLabels';

const PRIMARY = '#7c3aed';
const PRIMARY_LIGHT = '#ede9fe';

/**
 * The selects sit in a dense grid next to a plain input, so they are pulled down to the same
 * 36px box as that input and lose react-select's default chrome.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conditionSelectStyles: StylesConfig<any, false, any> = {
  control: (base, state) => ({
    ...base,
    minHeight: '36px',
    height: '36px',
    fontSize: '0.875rem',
    borderRadius: '8px',
    borderColor: state.isFocused ? PRIMARY : 'var(--gray-100)',
    boxShadow: state.isFocused ? `0 0 0 3px ${PRIMARY_LIGHT}` : 'none',
    ':hover': { borderColor: state.isFocused ? PRIMARY : 'var(--gray-200)' },
  }),
  valueContainer: (base) => ({ ...base, padding: '0 8px' }),
  indicatorsContainer: (base) => ({ ...base, height: '34px' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: (base) => ({ ...base, padding: '0 6px', color: 'var(--gray-500)' }),
  groupHeading: (base) => ({
    ...base,
    fontSize: '0.6875rem',
    letterSpacing: '0.06em',
    color: 'var(--gray-500)',
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '0.875rem',
    backgroundColor: state.isSelected
      ? PRIMARY
      : state.isFocused
        ? PRIMARY_LIGHT
        : base.backgroundColor,
    color: state.isSelected ? '#ffffff' : base.color,
    ':active': { backgroundColor: PRIMARY, color: '#ffffff' },
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

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

/** Column titles above the rows; shares its grid with the rows so the columns line up. */
export function AutoTagConditionHeader() {
  return (
    <div className="c-auto-tag-condition-grid c-auto-tag-condition-header">
      <span>Join</span>
      <span>Field</span>
      <span>Condition</span>
      <span>Value</span>
      <span />
    </div>
  );
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
  const regexCheck = React.useMemo(
    () => (isRegexOperator(operator) ? checkRegex(value) : null),
    [operator, value]
  );

  return (
    <div className="c-auto-tag-condition-grid c-auto-tag-condition">
      <div>
        {/* Sits on the divider between this row and the one above it, because that is the seam
            it actually describes: it joins two rows rather than belonging to either. */}
        {showBooleanOperator ? (
          <button
            type="button"
            aria-label={`Join with the previous condition using ${booleanOperator}, click to switch`}
            className={
              'c-auto-tag-condition__join' +
              (booleanOperator === types.BooleanOperator.AND
                ? ' c-auto-tag-condition__join--and'
                : ' c-auto-tag-condition__join--or')
            }
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
        ) : null}
      </div>

      <Select<
        SelectOption<types.ConditionVariable>,
        false,
        GroupBase<SelectOption<types.ConditionVariable>>
      >
        aria-label="Field"
        className="c-auto-tag-condition__select"
        value={variable ? { label: conditionVariableLabel(variable), value: variable } : null}
        options={CONDITION_VARIABLE_GROUPS}
        onChange={(selectedOption) =>
          onChange(booleanOperator, selectedOption?.value ?? null, operator, value)
        }
        isMulti={false}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={conditionSelectStyles}
      />

      <Select<SelectOption<types.ConditionOperator>>
        aria-label="Condition"
        className="c-auto-tag-condition__select"
        value={operator ? { label: conditionOperatorLabel(operator), value: operator } : null}
        options={CONDITION_OPERATOR_OPTIONS}
        onChange={(selectedOption) =>
          onChange(booleanOperator, variable, selectedOption?.value ?? null, value)
        }
        isMulti={false}
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={conditionSelectStyles}
      />

      <div className="c-auto-tag-condition__value-cell">
        <input
          className={
            'c-input c-auto-tag-condition__value' +
            (regexCheck ? ` c-input--${regexCheck.valid ? 'valid' : 'invalid'}` : '')
          }
          aria-label="Value"
          aria-invalid={regexCheck ? !regexCheck.valid : undefined}
          placeholder={isRegexOperator(operator) ? 'e.g. ^Timesheet.*' : 'Text to match'}
          value={value}
          onChange={(evt) => onChange(booleanOperator, variable, operator, evt.target.value)}
        />
        {regexCheck && (
          <span
            role="status"
            className={'c-regex-status' + (regexCheck.valid ? '' : ' c-regex-status--invalid')}
          >
            {regexCheck.message}
          </span>
        )}
      </div>

      <div className="c-auto-tag-condition__actions">
        {showDelete && (
          <button
            type="button"
            className="c-auto-tag-condition__delete"
            title="Remove condition"
            aria-label="Remove condition"
            onClick={() => onDelete(index)}
          >
            <Trash2Icon size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

export default AutoTagConditionInput;
