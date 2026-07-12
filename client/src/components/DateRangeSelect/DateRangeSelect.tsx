import './DateRangeSelect.css';
import React from 'react';
import { format, parseISO } from 'date-fns';
import { DateRangeMode } from '../../types/types';

const PRESETS: { mode: DateRangeMode; label: string }[] = [
  { mode: DateRangeMode.Today, label: 'Today' },
  { mode: DateRangeMode.ThisWeek, label: 'This week' },
  { mode: DateRangeMode.ThisMonth, label: 'This month' },
  { mode: DateRangeMode.Last7Days, label: 'Last 7 days' },
  { mode: DateRangeMode.Last30Days, label: 'Last 30 days' },
  { mode: DateRangeMode.Custom, label: 'Custom' },
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
  return (
    <div className={`c-date-range-select${className ? ' ' + className : ''}`}>
      <div className="c-date-range-select__presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.mode}
            className={`c-date-range-select__preset${mode === preset.mode ? ' is-active' : ''}`}
            onClick={() => onChange(preset.mode, customStartedAt ?? undefined, customEndedAt ?? undefined)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      {mode === DateRangeMode.Custom && (
        <div className="c-date-range-select__custom">
          <input
            type="date"
            value={customStartedAt ? format(parseISO(customStartedAt), 'yyyy-MM-dd') : ''}
            onChange={(evt) => onChange(DateRangeMode.Custom, evt.target.value, customEndedAt ?? undefined)}
          />
          <span>to</span>
          <input
            type="date"
            value={customEndedAt ? format(parseISO(customEndedAt), 'yyyy-MM-dd') : ''}
            onChange={(evt) => onChange(DateRangeMode.Custom, customStartedAt ?? undefined, evt.target.value)}
          />
        </div>
      )}
    </div>
  );
}
