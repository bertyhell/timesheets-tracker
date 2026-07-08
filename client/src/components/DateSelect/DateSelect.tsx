import { addDays, format, parseISO } from 'date-fns';
import Button, { ButtonSize, ButtonVariant } from '../Button/Button';
import { useAtom } from 'jotai';
import React from 'react';

import { viewDateAtom } from '../../store/store';

function DateSelect({ className }: { className?: string }) {
  const [viewDate, setViewDate] = useAtom(viewDateAtom);

  return (
    <div className={`flex flex-row items-center gap-1${className ? ' ' + className : ''}`}>
      <Button
        className="hidden wide:inline-flex"
        onClick={() => setViewDate(new Date())}
        variant={ButtonVariant.Primary}
        size={ButtonSize.Small}
      >
        Today
      </Button>
      <div className="hidden wide:flex flex-row bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setViewDate((prevDate) => addDays(prevDate, -1))}
          className="px-2 py-1.5 text-gray-600 hover:bg-gray-200 transition-colors text-sm font-medium"
          aria-label="Previous day"
        >
          ‹
        </button>
        <button
          onClick={() => setViewDate((prevDate) => addDays(prevDate, 1))}
          className="px-2 py-1.5 text-gray-600 hover:bg-gray-200 transition-colors text-sm font-medium border-l border-gray-200"
          aria-label="Next day"
        >
          ›
        </button>
      </div>
      <div className="c-current-flex flex-row items-center gap-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700">
        <span className="font-medium inline-block text-right min-w-[2.2rem]">
          {format(viewDate, 'eee,')}
        </span>
        <input
          type="date"
          value={format(viewDate, 'yyyy-MM-dd')}
          onChange={(evt) => setViewDate(parseISO(evt.target.value))}
          className="border-none bg-transparent p-0 text-sm text-gray-700 cursor-pointer outline-none"
        />
      </div>
    </div>
  );
}

export default DateSelect;
