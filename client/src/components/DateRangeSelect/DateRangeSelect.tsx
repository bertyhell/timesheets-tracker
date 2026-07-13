import './DateRangeSelect.css';
import React from 'react';
import { format, parseISO } from 'date-fns';
import { DateRangeMode } from '../../types/types';
import { Dropdown } from '../Dropdown/Dropdown';

const PRESETS: { mode: DateRangeMode; label: string }[] = [
  { mode: DateRangeMode.Today, label: 'Today' },
  { mode: DateRangeMode.ThisWeek, label: 'This week' },
  { mode: DateRangeMode.ThisMonth, label: 'This month' },
  { mode: DateRangeMode.ThisYear, label: 'This year' },
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

function formatCustomLabel(customStartedAt?: string | null, customEndedAt?: string | null): string {
  if (!customStartedAt && !customEndedAt) return 'Custom range';
  const start = customStartedAt ? format(parseISO(customStartedAt), 'MMM d, yyyy') : '…';
  const end = customEndedAt ? format(parseISO(customEndedAt), 'MMM d, yyyy') : '…';
  return `${start} – ${end}`;
}

export function DateRangeSelect({
  mode,
  customStartedAt,
  customEndedAt,
  onChange,
  className,
}: DateRangeSelectProps) {
  const activePreset = PRESETS.find((preset) => preset.mode === mode);
  const label =
    mode === DateRangeMode.Custom
      ? formatCustomLabel(customStartedAt, customEndedAt)
      : activePreset?.label ?? 'Select range';

  return (
    <Dropdown label={label} className={`c-date-range-select${className ? ' ' + className : ''}`}>
      {(close) => (
        <div className="c-date-range-select__panel">
          {PRESETS.map((preset) => (
            <button
              key={preset.mode}
              className={`c-date-range-select__preset${mode === preset.mode ? ' is-active' : ''}`}
              onClick={() => {
                onChange(preset.mode, customStartedAt ?? undefined, customEndedAt ?? undefined);
                if (preset.mode !== DateRangeMode.Custom) close();
              }}
            >
              {preset.label}
            </button>
          ))}

          {mode === DateRangeMode.Custom && (
            <div className="c-date-range-select__custom">
              <label>
                <span>From</span>
                <input
                  type="date"
                  value={customStartedAt ? format(parseISO(customStartedAt), 'yyyy-MM-dd') : ''}
                  onChange={(evt) => onChange(DateRangeMode.Custom, evt.target.value, customEndedAt ?? undefined)}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="date"
                  value={customEndedAt ? format(parseISO(customEndedAt), 'yyyy-MM-dd') : ''}
                  onChange={(evt) => onChange(DateRangeMode.Custom, customStartedAt ?? undefined, evt.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      )}
    </Dropdown>
  );
}
