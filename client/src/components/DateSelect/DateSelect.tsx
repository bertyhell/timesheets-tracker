import './DateSelect.scss';

import { addDays, format, parseISO } from 'date-fns';
import { useAtom } from 'jotai';
import React from 'react';

import { viewDateAtom } from '../../store/store';

// interface DateSelectProps {}

function DateSelect() {
  const [viewDate, setViewDate] = useAtom(viewDateAtom);

  return (
    <div className="c-date-select">
      <button className="c-button" onClick={() => setViewDate(new Date())}>
        TODAY
      </button>
      <button className="c-button" onClick={() => setViewDate((prevDate) => addDays(prevDate, -1))}>
        -
      </button>
      <span>{format(viewDate, 'eee')}</span>
      <input
        type="date"
        value={format(viewDate, 'yyyy-MM-dd')}
        onChange={(evt) => setViewDate(parseISO(evt.target.value))}
      />
      <button className="c-button" onClick={() => setViewDate((prevDate) => addDays(prevDate, 1))}>
        +
      </button>
    </div>
  );
}

export default DateSelect;
