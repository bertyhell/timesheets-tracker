import './GrowAutoTagsModal.css';

import React, { type FC, useMemo, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { parseISO } from 'date-fns';

import Button, { ButtonVariant } from '../Button/Button';
import ToggleButton from '../ToggleButton/ToggleButton';
import type {
  AutoTagEventInfoDto,
  TagEventInfoDto,
  TagNameDto,
  TimelineDto,
  TimelineEventDto,
  TimelineWithEventsDto,
} from '../../generated/api/types.gen';
import {
  tagNamesControllerFindAllOptions,
  tagsControllerCreateMutation,
  tagsControllerRemoveMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import { TimelineType } from '../Timeline/Timeline.types';
import { getColorForEvent } from '../Timeline/helpers/getColorForEvent';
import { getEventLabel } from '../Timeline/helpers/getEventLabel';
import { formatHoursMinutes } from '../Timeline/helpers/prepareEvents';
import { GrowPreviewRuler, GrowPreviewTimeline, type PreviewBar } from './GrowPreviewTimeline';
import {
  getEventBounds,
  growAutoTagEvents,
  type GrownAutoTagEvent,
  type Interval,
  MIN_TAG_DURATION_MS,
  subtractIntervals,
} from './helpers/growAutoTagEvents';
import {
  type GrowSettings,
  readGrowSettings,
  writeGrowSettings,
} from './helpers/growSettingsStorage';

/** A little air on both sides of the preview, so bars at the edges stay readable. */
const PREVIEW_PADDING_MS = 5 * 60 * 1000;

interface GrowAutoTagsModalProps {
  open: boolean;
  onClose: () => void;
  timelineInfos: TimelineDto[] | undefined;
  timelinesWithEvents: TimelineWithEventsDto[] | undefined;
  /** Called after tags were written, so the day can be reloaded. */
  onTagsChanged: () => Promise<unknown>;
}

function toInterval(event: TimelineEventDto): Interval {
  return { startMs: parseISO(event.startedAt).getTime(), endMs: parseISO(event.endedAt).getTime() };
}

export const GrowAutoTagsModal: FC<GrowAutoTagsModalProps> = ({
  open,
  onClose,
  timelineInfos,
  timelinesWithEvents,
  onTagsChanged,
}) => {
  // Kept in local storage: the same growth is usually wanted day after day.
  const [settings, setSettings] = useState<GrowSettings>(readGrowSettings);
  const { maxGrowMinutes, boundTimelineIds, overrideTags, excludedTagNameTitles } = settings;
  const [isCopying, setIsCopying] = useState(false);

  const updateSettings = (change: Partial<GrowSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...change };
      writeGrowSettings(next);
      return next;
    });
  };

  const { mutateAsync: createTag } = useMutation({ ...tagsControllerCreateMutation() });
  const { mutateAsync: removeTag } = useMutation({ ...tagsControllerRemoveMutation() });

  const tagTimeline = useMemo(
    () => timelinesWithEvents?.find((timeline) => timeline.type === TimelineType.Tag) ?? null,
    [timelinesWithEvents]
  );
  const autoTagTimeline = useMemo(
    () => timelinesWithEvents?.find((timeline) => timeline.type === TimelineType.AutoTag) ?? null,
    [timelinesWithEvents]
  );
  const tagTimelineInfo = useMemo(
    () => timelineInfos?.find((timeline) => timeline.id === tagTimeline?.id),
    [timelineInfos, tagTimeline?.id]
  );
  const autoTagTimelineInfo = useMemo(
    () => timelineInfos?.find((timeline) => timeline.id === autoTagTimeline?.id),
    [timelineInfos, autoTagTimeline?.id]
  );

  const tagEvents = useMemo(() => tagTimeline?.events ?? [], [tagTimeline]);
  const autoTagEvents = useMemo(() => autoTagTimeline?.events ?? [], [autoTagTimeline]);

  /** Timelines that actually carry events today are the only ones worth bounding against. */
  const boundableTimelines = useMemo(
    () =>
      (timelineInfos ?? []).filter((timelineInfo) => {
        if (timelineInfo.timelineType === TimelineType.AutoTag) return false;
        const events = timelinesWithEvents?.find(
          (timeline) => timeline.id === timelineInfo.id
        )?.events;
        return !!events?.length;
      }),
    [timelineInfos, timelinesWithEvents]
  );

  // The tag names are the source of truth for "can grow": reading them here rather than off the
  // day's auto tag events means toggling one takes effect without reloading the day. Only fetched
  // while the dialog is open.
  const { data: tagNames } = useQuery({ ...tagNamesControllerFindAllOptions(), enabled: open });

  const canGrowByTagNameId = useMemo(() => {
    const byId = new Map<string, boolean>();
    ((tagNames as TagNameDto[]) ?? []).forEach((tagName) => {
      if (tagName.id) byId.set(tagName.id, !!tagName.canGrow);
    });
    return byId;
  }, [tagNames]);

  const bounds = useMemo(() => {
    if (!boundTimelineIds.length) return null;
    const events = (timelinesWithEvents ?? [])
      .filter((timeline) => boundTimelineIds.includes(timeline.id))
      .flatMap((timeline) => timeline.events);
    return getEventBounds(events);
  }, [boundTimelineIds, timelinesWithEvents]);

  const grownEvents: GrownAutoTagEvent[] = useMemo(
    () =>
      growAutoTagEvents(autoTagEvents, {
        maxGrowMs: maxGrowMinutes * 60 * 1000,
        bounds,
        canGrowByTagNameId,
      }),
    [autoTagEvents, maxGrowMinutes, bounds, canGrowByTagNameId]
  );

  const growableCount = grownEvents.filter((entry) => entry.canGrow).length;
  const grownMs = grownEvents.reduce(
    (total, entry) =>
      total + (entry.endMs - entry.startMs) - (entry.originalEndMs - entry.originalStartMs),
    0
  );

  /**
   * The span every row is drawn against. Once timelines are picked to stay within, their first and
   * last event set it, so the bounds read as the frame the rest of the day is measured in.
   */
  const previewWindow = useMemo(() => {
    if (bounds) {
      return { minMs: bounds.minMs - PREVIEW_PADDING_MS, maxMs: bounds.maxMs + PREVIEW_PADDING_MS };
    }
    const all = [...tagEvents.map(toInterval), ...grownEvents.map((entry) => entry)];
    if (!all.length) return null;
    const minMs = Math.min(...all.map((entry) => entry.startMs)) - PREVIEW_PADDING_MS;
    const maxMs = Math.max(...all.map((entry) => entry.endMs)) + PREVIEW_PADDING_MS;
    return { minMs, maxMs };
  }, [bounds, tagEvents, grownEvents]);

  const tagBars: PreviewBar[] = useMemo(
    () =>
      tagEvents.map((event) => ({
        id: event.id,
        ...toInterval(event),
        label: tagTimelineInfo ? getEventLabel(tagTimelineInfo, event) : '',
        color:
          (tagTimelineInfo && getColorForEvent(tagTimelineInfo, event)) ||
          (event.info as TagEventInfoDto)?.tagNameColor ||
          '#888888',
      })),
    [tagEvents, tagTimelineInfo]
  );

  const autoTagBars: PreviewBar[] = useMemo(
    () =>
      autoTagEvents.map((event) => ({
        id: event.id,
        ...toInterval(event),
        label: autoTagTimelineInfo ? getEventLabel(autoTagTimelineInfo, event) : '',
        color:
          (autoTagTimelineInfo && getColorForEvent(autoTagTimelineInfo, event)) ||
          (event.info as AutoTagEventInfoDto)?.tagNameColor ||
          '#888888',
      })),
    [autoTagEvents, autoTagTimelineInfo]
  );

  /**
   * One plain block from the first to the last event of the picked timelines. Unlabelled on purpose:
   * the point is not what happened when, but the stretch the auto tags may grow inside.
   */
  const boundsBars: PreviewBar[] = useMemo(
    () =>
      bounds
        ? [{ id: 'bounds', startMs: bounds.minMs, endMs: bounds.maxMs, label: '', color: '#d1d5db' }]
        : [],
    [bounds]
  );

  const grownBars: PreviewBar[] = useMemo(
    () =>
      grownEvents.map((entry) => ({
        id: entry.event.id,
        startMs: entry.startMs,
        endMs: entry.endMs,
        originalStartMs: entry.originalStartMs,
        originalEndMs: entry.originalEndMs,
        label: autoTagTimelineInfo ? getEventLabel(autoTagTimelineInfo, entry.event) : '',
        color:
          (autoTagTimelineInfo && getColorForEvent(autoTagTimelineInfo, entry.event)) ||
          (entry.event.info as AutoTagEventInfoDto)?.tagNameColor ||
          '#888888',
      })),
    [grownEvents, autoTagTimelineInfo]
  );

  /**
   * What "copy to tags" would write: every grown auto tag that carries a tag name, cut back to the
   * free time when the existing tags are kept, or taken whole when they are overridden.
   */
  const plannedTags = useMemo(() => {
    const existingIntervals = tagEvents.map(toInterval);
    return grownEvents.flatMap((entry) => {
      const info = entry.event.info as AutoTagEventInfoDto;
      if (!info?.tagNameId) return [];
      if (excludedTagNameTitles.includes(info.tagNameTitle)) return [];
      const pieces = overrideTags
        ? [{ startMs: entry.startMs, endMs: entry.endMs }]
        : subtractIntervals({ startMs: entry.startMs, endMs: entry.endMs }, existingIntervals);
      return pieces
        .filter((piece) => piece.endMs - piece.startMs >= MIN_TAG_DURATION_MS)
        .map((piece) => ({ ...piece, info }));
    });
  }, [grownEvents, tagEvents, overrideTags, excludedTagNameTitles]);

  /** Existing tags that overlap what is about to be written, and so have to make way for it. */
  const tagsToDelete = useMemo(() => {
    if (!overrideTags) return [];
    return tagEvents.filter((event) => {
      const existing = toInterval(event);
      return plannedTags.some(
        (planned) => planned.startMs < existing.endMs && planned.endMs > existing.startMs
      );
    });
  }, [overrideTags, tagEvents, plannedTags]);

  /** The tag names carried by today's auto tags, each listed once, in the order they first appear. */
  const presentTagNames = useMemo(() => {
    const byTitle = new Map<string, { title: string; color: string }>();
    autoTagEvents.forEach((event) => {
      const info = event.info as AutoTagEventInfoDto;
      if (!info?.tagNameId || byTitle.has(info.tagNameTitle)) return;
      byTitle.set(info.tagNameTitle, {
        title: info.tagNameTitle,
        color: info.tagNameColor || '#888888',
      });
    });
    return [...byTitle.values()];
  }, [autoTagEvents]);

  const pickedTagNameCount = presentTagNames.filter(
    (tagName) => !excludedTagNameTitles.includes(tagName.title)
  ).length;

  const handleToggleTagName = (title: string) => {
    updateSettings({
      excludedTagNameTitles: excludedTagNameTitles.includes(title)
        ? excludedTagNameTitles.filter((excluded) => excluded !== title)
        : [...excludedTagNameTitles, title],
    });
  };

  /** The tag row as it will stand once the copy ran: what survives it, plus what it writes. */
  const resultingTagBars: PreviewBar[] = useMemo(() => {
    const deletedIds = new Set(tagsToDelete.map((event) => event.id));
    const kept = tagBars.filter((bar) => !deletedIds.has(bar.id));
    const added = plannedTags.map((planned, index) => ({
      id: `planned-${index}`,
      startMs: planned.startMs,
      endMs: planned.endMs,
      label: planned.info.tagNameTitle,
      color: planned.info.tagNameColor || '#888888',
    }));
    return [...kept, ...added];
  }, [tagBars, tagsToDelete, plannedTags]);

  const handleToggleBoundTimeline = (timelineId: string) => {
    updateSettings({
      boundTimelineIds: boundTimelineIds.includes(timelineId)
        ? boundTimelineIds.filter((id) => id !== timelineId)
        : [...boundTimelineIds, timelineId],
    });
  };

  const handleCopyToTags = async () => {
    if (!plannedTags.length) return;
    setIsCopying(true);
    try {
      for (const tag of tagsToDelete) {
        await removeTag({ path: { id: tag.id } });
      }
      for (const planned of plannedTags) {
        const note = planned.info.tagNameNote?.trim();
        await createTag({
          body: {
            tagNameId: planned.info.tagNameId,
            startedAt: new Date(planned.startMs).toISOString(),
            endedAt: new Date(planned.endMs).toISOString(),
            ...(note ? { note } : {}),
          },
        });
      }
      await onTagsChanged();
      toast(
        plannedTags.length === 1
          ? 'Tag has been created'
          : `${plannedTags.length} tags have been created`,
        { type: 'success' }
      );
      onClose();
    } catch {
      await onTagsChanged();
      toast('The grown tags could not be copied', { type: 'error' });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      classNames={{ modal: 'c-grow-auto-tags-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>Grow auto tags</h3>
      <p className="c-grow-auto-tags-modal__intro">
        Auto tags of a tag marked as <b>can grow</b> are stretched into the free time around them.
        They stop when they meet the next auto tag, and two growing neighbours meet in the middle.
      </p>

      <div className="c-grow-auto-tags-modal__options">
        <label className="c-grow-auto-tags-modal__option">
          <span>Grow by at most</span>
          <input
            className="c-input c-grow-auto-tags-modal__minutes"
            type="number"
            min={0}
            max={480}
            step={5}
            value={maxGrowMinutes}
            onChange={(e) =>
              updateSettings({ maxGrowMinutes: Math.max(0, Number(e.target.value) || 0) })
            }
          />
          <span>minutes on each side</span>
        </label>

        <div className="c-grow-auto-tags-modal__option c-grow-auto-tags-modal__option--column">
          {!boundableTimelines.length ? (
            <span className="c-grow-auto-tags-modal__hint">No other timeline has events today</span>
          ) : (
            /* Closed to start with: the picks are remembered, so the list is only unfolded on the
               rare day it has to change. */
            <details className="c-grow-auto-tags-modal__accordion c-grow-auto-tags-modal__accordion--boxed">
              <summary>{`Stay within these ${boundTimelineIds.length} timeline events`}</summary>
              <div className="c-grow-auto-tags-modal__checkbox-list">
                {boundableTimelines.map((timelineInfo) => (
                  <label key={timelineInfo.id} className="c-grow-auto-tags-modal__checkbox">
                    <input
                      type="checkbox"
                      checked={boundTimelineIds.includes(timelineInfo.id)}
                      onChange={() => handleToggleBoundTimeline(timelineInfo.id)}
                    />
                    <span>{timelineInfo.title}</span>
                  </label>
                ))}
              </div>
            </details>
          )}
          <span className="c-grow-auto-tags-modal__hint">
            {bounds
              ? `Auto tags stay between ${formatHoursMinutes(new Date(bounds.minMs))} and ${formatHoursMinutes(new Date(bounds.maxMs))}, the first and last event of the picked timelines.`
              : 'Without a pick, auto tags may grow anywhere on the day.'}
          </span>
        </div>
      </div>

      {!previewWindow ? (
        <div className="c-grow-auto-tags-modal__empty">Nothing to grow on this day</div>
      ) : (
        <>
          <div className="c-grow-auto-tags-modal__section">
            <GrowPreviewRuler minMs={previewWindow.minMs} maxMs={previewWindow.maxMs} />
            <GrowPreviewTimeline
              title="Auto tags"
              bars={autoTagBars}
              minMs={previewWindow.minMs}
              maxMs={previewWindow.maxMs}
              emptyMessage="No auto tags"
            />
            <GrowPreviewTimeline
              title="Bounds"
              bars={boundsBars}
              minMs={previewWindow.minMs}
              maxMs={previewWindow.maxMs}
              emptyMessage="No timeline picked to stay within"
            />
          </div>

          {/* Set apart from the timelines around it: this row is a proposal, not something that
              exists yet, and reads as one only when it does not sit flush against the real ones. */}
          <div className="c-grow-auto-tags-modal__section c-grow-auto-tags-modal__section--preview">
            <div className="c-grow-auto-tags-modal__preview-header">
              <span className="c-grow-auto-tags-modal__preview-badge">Preview</span>
              <span>
                {growableCount === 0
                  ? 'None of the auto tags today belong to a tag that can grow'
                  : `${growableCount} of ${grownEvents.length} auto tags can grow, adding ${Math.round(grownMs / 60_000)} minutes in total`}
              </span>
            </div>
            <GrowPreviewRuler minMs={previewWindow.minMs} maxMs={previewWindow.maxMs} />
            <GrowPreviewTimeline
              title="Auto tags (grown)"
              bars={grownBars}
              minMs={previewWindow.minMs}
              maxMs={previewWindow.maxMs}
              emptyMessage="No auto tags"
            />
          </div>

          <div className="c-grow-auto-tags-modal__apply">
            {!!presentTagNames.length && (
              <div className="c-grow-auto-tags-modal__option c-grow-auto-tags-modal__option--column c-grow-auto-tags-modal__tag-names">
                <details className="c-grow-auto-tags-modal__accordion">
                  <summary>{`Copy these ${pickedTagNameCount} tags`}</summary>
                  <div className="c-grow-auto-tags-modal__checkbox-list">
                    {presentTagNames.map((tagName) => (
                      <label key={tagName.title} className="c-grow-auto-tags-modal__checkbox">
                        <input
                          type="checkbox"
                          checked={!excludedTagNameTitles.includes(tagName.title)}
                          onChange={() => handleToggleTagName(tagName.title)}
                        />
                        <span
                          className="c-grow-auto-tags-modal__tag-dot"
                          style={{ backgroundColor: tagName.color }}
                        />
                        <span>{tagName.title}</span>
                      </label>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          <div className="c-grow-auto-tags-modal__option c-grow-auto-tags-modal__existing-tags">
            <span>Existing tags</span>
            <ToggleButton
              optionTwoSelected={overrideTags}
              onChange={(value) => updateSettings({ overrideTags: value })}
              label1="Keep"
              label2="Override"
            />
            <span className="c-grow-auto-tags-modal__hint">
              {overrideTags
                ? `${tagsToDelete.length} overlapping tag${tagsToDelete.length === 1 ? '' : 's'} will be deleted first.`
                : 'The grown tags are trimmed so they do not overlap the tags already there.'}
            </span>
          </div>

          <div className="c-grow-auto-tags-modal__section">
            <GrowPreviewRuler minMs={previewWindow.minMs} maxMs={previewWindow.maxMs} />
            <GrowPreviewTimeline
              title="Tags"
              bars={tagBars}
              minMs={previewWindow.minMs}
              maxMs={previewWindow.maxMs}
              emptyMessage="No tags"
            />
            <GrowPreviewTimeline
              title="Tags (preview)"
              bars={resultingTagBars}
              minMs={previewWindow.minMs}
              maxMs={previewWindow.maxMs}
              emptyMessage="No tags"
            />
          </div>
        </>
      )}

      <div className="c-grow-auto-tags-modal__footer">
        <Button onClick={onClose} disabled={isCopying} variant={ButtonVariant.Transparent}>
          Cancel
        </Button>
        <Button
          onClick={handleCopyToTags}
          disabled={!plannedTags.length || isCopying}
          variant={ButtonVariant.Primary}
        >
          {isCopying ? 'Copying…' : `Copy ${plannedTags.length} to tags`}
        </Button>
      </div>
    </Modal>
  );
};
