import './TimelineRuler.css';
import React from 'react';
import { differenceInMilliseconds, format } from 'date-fns';
import { getTicks } from './helpers/getTicks';

interface TimelineRulerProps {
  minTime: Date;
  maxTime: Date;
}

export function TimelineRuler({ minTime, maxTime }: TimelineRulerProps) {
  const windowMs = differenceInMilliseconds(maxTime, minTime);
  const ticks = getTicks(minTime, maxTime);

  return (
    <div className="c-timeline-ruler">
      <div className="c-timeline-ruler__gutter" />
      <div className="c-timeline-ruler__track">
        {ticks.map((tick) => {
          const leftPercent = (differenceInMilliseconds(tick, minTime) / windowMs) * 100;
          return (
            <div
              key={tick.toISOString()}
              className="c-timeline-ruler__tick"
              style={{ left: leftPercent + '%' }}
            >
              <span className="c-timeline-ruler__label">{format(tick, 'HH:mm')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
