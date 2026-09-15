import React, { type FC } from 'react';

import { getTicks } from '../Timeline/helpers/getTicks';
import { formatHoursMinutes, formatTimeRange } from '../Timeline/helpers/prepareEvents';

interface GrowPreviewRulerProps {
  minMs: number;
  maxMs: number;
}

/** Hour labels above a preview, so the bars can be placed on the day at a glance. */
export const GrowPreviewRuler: FC<GrowPreviewRulerProps> = ({ minMs, maxMs }) => {
  const ticks = getTicks(new Date(minMs), new Date(maxMs));
  return (
    <div className="c-grow-preview c-grow-preview--ruler">
      <div className="c-grow-preview__title" />
      <div className="c-grow-preview__track">
        {ticks.map((tick) => (
          <div
            key={'c-grow-preview__tick__' + tick.toISOString()}
            className="c-grow-preview__tick"
            style={{ left: ((tick.getTime() - minMs) / (maxMs - minMs)) * 100 + '%' }}
          >
            <span>{formatHoursMinutes(tick)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export interface PreviewBar {
  id: string;
  startMs: number;
  endMs: number;
  label: string;
  color: string;
  /** Start and end before growing, drawn as a lighter outline behind the bar. */
  originalStartMs?: number;
  originalEndMs?: number;
}

interface GrowPreviewTimelineProps {
  title: string;
  bars: PreviewBar[];
  minMs: number;
  maxMs: number;
  emptyMessage: string;
}

/**
 * A read-only stand-in for the real timeline: same visual language, none of the selecting,
 * resizing or context menus, because the preview is only there to be looked at.
 */
export const GrowPreviewTimeline: FC<GrowPreviewTimelineProps> = ({
  title,
  bars,
  minMs,
  maxMs,
  emptyMessage,
}) => {
  const windowMs = maxMs - minMs;
  const toPercent = (ms: number) => ((ms - minMs) / windowMs) * 100;

  return (
    <div className="c-grow-preview">
      <div className="c-grow-preview__title">{title}</div>
      <div className="c-grow-preview__track">
        {!bars.length && <div className="c-grow-preview__empty">{emptyMessage}</div>}
        {bars.map((bar) => {
          const left = toPercent(bar.startMs);
          const width = Math.max(toPercent(bar.endMs) - left, 0.15);
          const hasGrowth =
            bar.originalStartMs !== undefined &&
            bar.originalEndMs !== undefined &&
            (bar.originalStartMs !== bar.startMs || bar.originalEndMs !== bar.endMs);

          return (
            <React.Fragment key={bar.id}>
              {hasGrowth && (
                <div
                  className="c-grow-preview__original"
                  style={{
                    left: toPercent(bar.originalStartMs!) + '%',
                    width:
                      Math.max(
                        toPercent(bar.originalEndMs!) - toPercent(bar.originalStartMs!),
                        0.15
                      ) + '%',
                    borderColor: bar.color,
                  }}
                />
              )}
              <div
                className={'c-grow-preview__bar' + (hasGrowth ? ' c-grow-preview__bar--grown' : '')}
                style={{
                  left: left + '%',
                  width: width + '%',
                  backgroundColor: bar.color + '33',
                  borderLeft: `3px solid ${bar.color}`,
                }}
                title={`${bar.label}\n${formatTimeRange(bar.startMs, bar.endMs)}`}
              >
                <span className="c-grow-preview__bar-label">{bar.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
