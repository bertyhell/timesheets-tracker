import './EditTimelineModal.css';

import React, { type ChangeEvent, useEffect, useState } from 'react';
import Button, { ButtonVariant } from '../Button/Button';
import { Modal } from 'react-responsive-modal';
import { ROUTE_PARTS } from '../../App';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  timelinesControllerCreateMutation,
  timelinesControllerDeleteMutation,
  timelinesControllerFindAllOptions,
  timelinesControllerFindOneOptions,
  timelinesControllerUpdateMutation,
} from '../../generated/api/@tanstack/react-query.gen';
import type { TimelineType } from '../../generated/api/types.gen';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ColorInput } from '../ColorInput/ColorInput';
import { COLOR_LIST } from '../Timeline/helpers/getColorForEvent';

const TIMELINE_TYPES: TimelineType[] = [
  'ActiveState',
  'AutoTag',
  'Calendar',
  'Program',
  'Tag',
  'Website',
];

export function EditTimelineModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [timelineType, setTimelineType] = useState<TimelineType>('Program');
  const [icsUrl, setIcsUrl] = useState<string>('');
  const [visualOrder, setVisualOrder] = useState<number>(0);
  const [color, setColor] = useState<string>(COLOR_LIST[0]);

  const { mutateAsync: createTimeline } = useMutation({ ...timelinesControllerCreateMutation() });
  const { mutateAsync: updateTimeline } = useMutation({ ...timelinesControllerUpdateMutation() });
  const { mutateAsync: deleteTimeline } = useMutation({ ...timelinesControllerDeleteMutation() });
  const { data: allTimelines } = useQuery({
    ...timelinesControllerFindAllOptions(),
    enabled: !id,
  });
  const { data: timelineResponse } = useQuery({
    ...timelinesControllerFindOneOptions({ path: { id: id as string } }),
    enabled: !!id,
  });

  useEffect(() => {
    if (timelineResponse) {
      setTitle(timelineResponse.title);
      setTimelineType(timelineResponse.timelineType);
      const info = timelineResponse.eventProviderInfo as Record<string, string> | null;
      setIcsUrl(timelineResponse.timelineType === 'Calendar' ? (info?.icsUrl ?? '') : '');
      setVisualOrder(timelineResponse.visualOrder);
      setColor(timelineResponse.color ?? COLOR_LIST[0]);
    }
  }, [timelineResponse]);

  useEffect(() => {
    if (!id && allTimelines) {
      const maxOrder = allTimelines.reduce((max, t) => Math.max(max, t.visualOrder ?? 0), -1);
      setVisualOrder(maxOrder + 1);
    }
  }, [id, allTimelines]);

  const handleClose = () => navigate('/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.timelines);

  const handleSave = async () => {
    if (id) {
      await updateTimeline({
        path: { id },
        body: {
          title,
          timelineType,
          eventProviderInfo: timelineType === 'Calendar' ? { icsUrl } : {},
          visualOrder,
          color,
        },
      });
      toast('Timeline has been updated', { type: 'success' });
    } else {
      await createTimeline({
        body: {
          title,
          timelineType,
          eventProviderInfo: timelineType === 'Calendar' ? { icsUrl } : {},
          visualOrder,
          color,
        },
      });
      toast('Timeline has been created', { type: 'success' });
    }

    handleClose();
  };

  const handleDelete = async () => {
    await deleteTimeline({ path: { id: id as string } });
    toast('Timeline has been deleted', { type: 'success' });
    handleClose();
  };

  return (
    <Modal
      open={true}
      onClose={handleClose}
      classNames={{ modal: 'c-edit-timeline-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Update timeline' : 'Add timeline'}</h3>

      <div className="c-form">
        <h4 className="mt-4">Type</h4>
        <select
          className="c-input"
          value={timelineType}
          onChange={(evt: ChangeEvent<HTMLSelectElement>) => {
            const newType = evt.target.value as TimelineType;
            setTimelineType(newType);
            if (newType !== 'Calendar') setIcsUrl('');
          }}
        >
          {TIMELINE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <h4 className="mt-4">Title</h4>
        <input
          className="c-input"
          value={title}
          onChange={(evt: ChangeEvent<HTMLInputElement>) => setTitle(evt.target.value)}
        />

        {timelineType === 'Calendar' && (
          <>
            <div className="flex justify-between items-center mt-4">
              <h4>Calendar ICS link</h4>
              <a
                href="https://www.onecal.io/blog/how-to-get-an-ics-url-for-your-calendar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                how to get .ics
              </a>
            </div>
            <input
              className="c-input"
              value={icsUrl}
              onChange={(evt: ChangeEvent<HTMLInputElement>) => setIcsUrl(evt.target.value)}
              placeholder="e.g. https://calendar.example.com/feed.ics"
            />
          </>
        )}

        <h4 className="mt-4">Visual ordering index</h4>
        <input
          className="c-input"
          type="number"
          value={visualOrder}
          onChange={(evt: ChangeEvent<HTMLInputElement>) =>
            setVisualOrder(Number(evt.target.value))
          }
        />

        <h4 className="mt-4">Color</h4>
        <ColorInput color={color} onChange={setColor} />
      </div>

      <div className="flex flex-row justify-between gap-2 mt-8">
        <div>
          {id && (
            <Button onClick={handleDelete} className="!bg-red-100 !text-red-700 hover:!bg-red-200">
              Delete
            </Button>
          )}
        </div>
        <div className="flex flex-row gap-2">
          <Button onClick={handleClose} variant={ButtonVariant.Secondary}>
            Cancel
          </Button>
          <Button disabled={!title} onClick={handleSave} variant={ButtonVariant.Primary}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
