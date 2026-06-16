import './DateSelect.css';

import { addDays, format, parseISO } from 'date-fns';
import Button, { ButtonVariant } from '../Button/Button';
import { useAtom } from 'jotai';
import React from 'react';

import { viewDateAtom } from '../../store/store';

// interface DateSelectProps {}

function DateSelect({ className }: { className?: string }) {
  const [viewDate, setViewDate] = useAtom(viewDateAtom);

  return (
    <div className={'c-date-select' + (className ? ' ' + className : '')}>
      <Button onClick={() => setViewDate(new Date())} variant={ButtonVariant.Transparent}>
        TODAY
      </Button>
      <Button
        onClick={() => setViewDate((prevDate) => addDays(prevDate, -1))}
        variant={ButtonVariant.Transparent}
      >
        -
      </Button>
      <span>{format(viewDate, 'eee')}</span>
      <input
        type="date"
        value={format(viewDate, 'yyyy-MM-dd')}
        onChange={(evt) => setViewDate(parseISO(evt.target.value))}
      />
      <Button
        onClick={() => setViewDate((prevDate) => addDays(prevDate, 1))}
        variant={ButtonVariant.Transparent}
      >
        +
      </Button>
    </div>
  );
}

export default DateSelect;
