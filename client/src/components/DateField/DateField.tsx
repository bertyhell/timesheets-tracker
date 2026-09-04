import { format, isValid, parseISO } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';
import { DatePicker } from 'rsuite';

// A partially typed year has to reach four digits before it means anything: `2` on its way to
// `2027` is not a year the rest of the app should ever see.
const MIN_COMPLETE_YEAR = 1000;

interface DateFieldProps {
  /** yyyy-MM-dd */
  value: string;
  /** Called with a yyyy-MM-dd string, only once a complete date has been entered. */
  onChange: (value: string) => void;
  shouldDisableDate?: (date: Date) => boolean;
  ariaLabel?: string;
  className?: string;
}

/**
 * Editable date field: type `04092027` straight through, no separators.
 *
 * The picker is deliberately left UNCONTROLLED. In controlled mode RSuite's DateInput rebuilds
 * its typing buffer from the `value` prop after every keystroke, and a half-typed year makes
 * that round trip lossy: `2` becomes `new Date(2, ...)`, which JS maps to 1902, so the next
 * digit is appended to 1902 rather than to `2`. Typing 2027 lands on 1907. Uncontrolled, the
 * buffer owns the digits and the year types through correctly; this component re-syncs it to
 * `value` by remounting, but only when the change came from outside.
 */
export function DateField({
  value,
  onChange,
  shouldDisableDate,
  ariaLabel,
  className,
}: DateFieldProps) {
  const [syncKey, setSyncKey] = useState(0);
  // The last value this field itself emitted, so an echo of our own change is not mistaken
  // for an outside one and does not remount the picker mid-typing.
  const emitted = useRef(value);
  // Set while the input holds digits that were typed but not complete enough to commit.
  const hasUncommittedEdit = useRef(false);

  useEffect(() => {
    if (value !== emitted.current) {
      emitted.current = value;
      setSyncKey((key) => key + 1);
    }
  }, [value]);

  return (
    <DatePicker
      key={syncKey}
      className={className}
      aria-label={ariaLabel}
      defaultValue={parseISO(value)}
      format="dd/MM/yyyy"
      editable
      oneTap
      cleanable={false}
      isoWeek
      size="sm"
      placement="bottomEnd"
      shouldDisableDate={shouldDisableDate}
      onChange={(date) => {
        if (!date || !isValid(date) || date.getFullYear() < MIN_COMPLETE_YEAR) {
          hasUncommittedEdit.current = true;
          return;
        }
        hasUncommittedEdit.current = false;
        const next = format(date, 'yyyy-MM-dd');
        emitted.current = next;
        onChange(next);
      }}
      onBlur={() => {
        // A half-typed date that was abandoned never got committed, so snap the display back
        // to the value that is actually in effect rather than leaving a lie on screen.
        if (hasUncommittedEdit.current) {
          hasUncommittedEdit.current = false;
          emitted.current = value;
          setSyncKey((key) => key + 1);
        }
      }}
    />
  );
}

export default DateField;
