import './BulkTagModal.css';

import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ROUTE_PARTS } from '../../App';
import {
  tagsControllerCreateMutation,
  timelinesControllerFindAllEventsOptions,
} from '../../generated/api/@tanstack/react-query.gen';
import type { TimelineEventDto } from '../../generated/api/types.gen';
import type { TagName } from '../../types/types';
import TagSelectSingle from '../TagSelect/TagSelectSingle';
import Button, { ButtonVariant } from '../Button/Button';
import { getOverlappingAutoTagNotes } from '../../helpers/get-overlapping-auto-tag-notes';

interface MergedInterval {
  startedAt: string;
  endedAt: string;
}

/** Sorts events by start time, then merges intervals whose gap is < gapMs. */
function mergeIntervals(events: TimelineEventDto[], gapMs = 60_000): MergedInterval[] {
  const sorted = [...events].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const merged: MergedInterval[] = [];

  for (const event of sorted) {
    const startMs = parseISO(event.startedAt).getTime();
    const endMs = parseISO(event.endedAt).getTime();

    if (merged.length === 0) {
      merged.push({ startedAt: event.startedAt, endedAt: event.endedAt });
    } else {
      const last = merged[merged.length - 1];
      const lastEndMs = parseISO(last.endedAt).getTime();

      if (startMs - lastEndMs < gapMs) {
        if (endMs > lastEndMs) last.endedAt = event.endedAt;
      } else {
        merged.push({ startedAt: event.startedAt, endedAt: event.endedAt });
      }
    }
  }

  return merged;
}

export function BulkTagModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const events: TimelineEventDto[] =
    (location.state as { events?: TimelineEventDto[] })?.events ?? [];

  const [selectedTagName, setSelectedTagName] = useState<TagName | null>(null);

  const { mutateAsync: createTag } = useMutation({ ...tagsControllerCreateMutation() });

  // Load the day of the selected events so the notes of the overlapping auto tags
  // can be copied onto the created tags
  const firstEventStartedAt = events[0]?.startedAt;
  const { data: dayTimelinesWithEvents } = useQuery({
    ...timelinesControllerFindAllEventsOptions({
      query: {
        startedAt: startOfDay(
          parseISO(firstEventStartedAt || new Date().toISOString())
        ).toISOString(),
        endedAt: endOfDay(parseISO(firstEventStartedAt || new Date().toISOString())).toISOString(),
      },
    }),
    enabled: !!firstEventStartedAt,
  });

  const handleClose = () => navigate('/' + ROUTE_PARTS.timelinesAndEvents);

  const handleSave = async () => {
    if (!selectedTagName?.id) {
      toast('Please select a tag name', { type: 'warning' });
      return;
    }
    if (events.length === 0) {
      toast('No events selected', { type: 'warning' });
      return;
    }

    const intervals = mergeIntervals(events);

    await Promise.all(
      intervals.map((interval) => {
        const note = getOverlappingAutoTagNotes(
          dayTimelinesWithEvents,
          parseISO(interval.startedAt),
          parseISO(interval.endedAt)
        ).join(', ');
        return createTag({
          body: {
            tagNameId: selectedTagName.id,
            startedAt: interval.startedAt,
            endedAt: interval.endedAt,
            ...(note ? { note } : {}),
          },
        });
      })
    );

    await queryClient.invalidateQueries({
      predicate: (query) =>
        (query.queryKey[0] as { _id?: string })?._id === 'timelinesControllerFindAllEvents',
    });

    const tagCount = intervals.length;
    toast(
      `Created ${tagCount} tag${tagCount !== 1 ? 's' : ''} from ${events.length} event${events.length !== 1 ? 's' : ''}`,
      { type: 'success' }
    );
    handleClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-bulk-tag-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>Add tag to events</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div className="c-form">
          <label>Tag name</label>
          <TagSelectSingle value={selectedTagName} onChange={setSelectedTagName} autoFocus />

          <label>Selection</label>
          <span className="c-bulk-tag-modal__event-count">
            {events.length} event{events.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex flex-row justify-end gap-2 mt-8">
          <Button onClick={handleClose} variant={ButtonVariant.Secondary}>
            Cancel
          </Button>
          <Button type="submit" variant={ButtonVariant.Primary}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
