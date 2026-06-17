import { addDays, format, parseISO } from 'date-fns';
import Button, { ButtonVariant } from '../Button/Button';
import { useAtom } from 'jotai';
import React from 'react';

import { viewDateAtom } from '../../store/store';

// interface DateSelectProps {}

function DateSelect({ className }: { className?: string }) {
  const [viewDate, setViewDate] = useAtom(viewDateAtom);

  return (
    <div
      className={
        'c-date-select' + (className ? ' ' + className : '') + ' flex flex-row gap-2 items-center'
      }
    >
      <Button onClick={() => setViewDate(new Date())} variant={ButtonVariant.Secondary}>
        TODAY
      </Button>
      <Button
        onClick={() => setViewDate((prevDate) => addDays(prevDate, -1))}
        variant={ButtonVariant.Tertiary}
        className="rounded-r-none"
      >
        &lt;
      </Button>
      <Button
        onClick={() => setViewDate((prevDate) => addDays(prevDate, 1))}
        variant={ButtonVariant.Tertiary}
        className="rounded-l-none"
      >
        &gt;
      </Button>
      <span className="text-right w-10">{format(viewDate, 'eee')}</span>
      <input
        type="date"
        value={format(viewDate, 'yyyy-MM-dd')}
        onChange={(evt) => setViewDate(parseISO(evt.target.value))}
      />
    </div>
  );
}

export default DateSelect;
