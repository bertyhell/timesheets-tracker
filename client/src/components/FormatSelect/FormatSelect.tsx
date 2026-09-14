import React, { useCallback, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

import { useDismiss } from '../../helpers/use-dismiss';
import type { FormatOption } from '../../helpers/csv-column-options';
import type { CsvValueFormat } from '../../types/types';

import './FormatSelect.css';

interface FormatSelectProps {
  options: FormatOption[];
  value: CsvValueFormat | '';
  onChange: (value: CsvValueFormat) => void;
  disabled?: boolean;
}

/**
 * Format picker showing the pattern on the left and what it actually produces on the right.
 *
 * A native `<select>` cannot lay an option out in two columns, and the example is the part that
 * makes the choice obvious — "dd/MM/yyyy" and "MM/dd/yyyy" are indistinguishable until you see one
 * of them rendered against a day past the 12th.
 */
export function FormatSelect({ options, value, onChange, disabled }: FormatSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  useDismiss(isOpen, close, [rootRef]);

  const selected = options.find((option) => option.value === value);
  const isDisabled = disabled || options.length === 0;

  return (
    <div className="c-format-select" ref={rootRef}>
      <button
        type="button"
        className="c-format-select__trigger"
        disabled={isDisabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isDisabled ? (
          <span className="c-format-select__placeholder">—</span>
        ) : (
          <>
            <span className="c-format-select__pattern">{selected?.label ?? '—'}</span>
            <span className="c-format-select__example">{selected?.example}</span>
          </>
        )}
        <ChevronDown size={14} className="c-format-select__chevron" />
      </button>

      {isOpen && !isDisabled && (
        <div className="c-format-select__menu" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={'c-format-select__option' + (option.value === value ? ' is-selected' : '')}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              <span className="c-format-select__pattern">{option.label}</span>
              <span className="c-format-select__example">{option.example}</span>
              {option.value === value && <Check size={14} className="c-format-select__check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
