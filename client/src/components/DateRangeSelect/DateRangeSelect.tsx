import './DateRangeSelect.css';
import React from 'react';
import { format, parseISO } from 'date-fns';
import { DateRangeMode } from '../../types/types';
import { resolveDateRange } from '../../helpers/resolve-date-range';
import { Dropdown } from '../Dropdown/Dropdown';
import { DateField } from '../DateField/DateField';

// Custom is deliberately absent: typing in one of the two date fields is what makes a range
// custom, so it never has to be picked from the list.
const PRESETS: { mode: DateRangeMode; label: string }[] = [
  { mode: DateRangeMode.Today, label: 'Today' },
  { mode: DateRangeMode.ThisWeek, label: 'This week' },
  { mode: DateRangeMode.ThisMonth, label: 'This month' },
  { mode: DateRangeMode.ThisYear, label: 'This year' },
  { mode: DateRangeMode.Last7Days, label: 'Last 7 days' },
  { mode: DateRangeMode.Last30Days, label: 'Last 30 days' },
  { mode: DateRangeMode.Last90Days, label: 'Last 90 days' },
  { mode: DateRangeMode.Last365Days, label: 'Last 365 days' },
];

interface DateRangeSelectProps {
  mode: DateRangeMode;
  customStartedAt?: string | null;
  customEndedAt?: string | null;
  onChange: (mode: DateRangeMode, customStartedAt?: string, customEndedAt?: string) => void;
  className?: string;
}

export function DateRangeSelect({
  mode,
  customStartedAt,
  customEndedAt,
  onChange,
  className,
}: DateRangeSelectProps) {
  // The date fields always show the range that is actually in effect, so picking a preset
  // fills them in and the user can then adjust either end by hand.
  const { startedAt, endedAt } = resolveDateRange(mode, customStartedAt, customEndedAt);
  const fromValue = format(parseISO(startedAt), 'yyyy-MM-dd');
  const toValue = format(parseISO(endedAt), 'yyyy-MM-dd');

  const label =
    mode === DateRangeMode.Custom
      ? 'Custom range'
      : (PRESETS.find((preset) => preset.mode === mode)?.label ?? 'Select range');

  return (
    <div className={`c-date-range-select${className ? ' ' + className : ''}`}>
      <Dropdown label={label} className="c-date-range-select__presets">
        {(close) => (
          <div className="c-date-range-select__panel">
            {PRESETS.map((preset) => (
              <button
                key={preset.mode}
                className={`c-date-range-select__preset${mode === preset.mode ? ' is-active' : ''}`}
                onClick={() => {
                  onChange(preset.mode, undefined, undefined);
                  close();
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </Dropdown>

      {/* Two independent pickers rather than a range picker: each end is edited on its own,
          and typing digits walks through the segments without needing separators. */}
      <div className="c-date-range-select__dates">
        <DateField
          className="c-date-range-select__date"
          ariaLabel="Range start"
          value={fromValue}
          shouldDisableDate={(date) => date > parseISO(endedAt)}
          onChange={(next) => onChange(DateRangeMode.Custom, next, toValue)}
        />
        <span className="c-date-range-select__arrow">→</span>
        <DateField
          className="c-date-range-select__date"
          ariaLabel="Range end"
          value={toValue}
          shouldDisableDate={(date) => date < parseISO(startedAt)}
          onChange={(next) => onChange(DateRangeMode.Custom, fromValue, next)}
        />
      </div>
    </div>
  );
}
