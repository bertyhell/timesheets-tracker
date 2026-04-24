import './EditTimelineModal.scss';

import React, { type ChangeEvent, useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { ROUTE_PARTS } from '../../App';
import {
  useTimelinesServiceTimelinesControllerCreate,
  useTimelinesServiceTimelinesControllerFindAll,
  useTimelinesServiceTimelinesControllerFindAllKey,
  useTimelinesServiceTimelinesControllerFindOne,
  useTimelinesServiceTimelinesControllerFindOneKey,
  useTimelinesServiceTimelinesControllerUpdate,
} from '../../generated/api/queries';
import type { TimelineType } from '../../generated/api/requests/types.gen';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const TIMELINE_TYPES: TimelineType[] = [
  'ActiveState',
  'AutoTag',
  'Calendar',
  'Program',
  'Tag',
  'Website',
];

function EditTimelineModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [timelineType, setTimelineType] = useState<TimelineType>('Program');
  const [icsUrl, setIcsUrl] = useState<string>('');
  const [visualOrder, setVisualOrder] = useState<number>(0);

  const { mutateAsync: createTimeline } = useTimelinesServiceTimelinesControllerCreate();
  const { mutateAsync: updateTimeline } = useTimelinesServiceTimelinesControllerUpdate();
  const { data: allTimelines } = useTimelinesServiceTimelinesControllerFindAll(
    { term: '' },
    [useTimelinesServiceTimelinesControllerFindAllKey],
    { enabled: !id }
  );
  const { data: timelineResponse } = useTimelinesServiceTimelinesControllerFindOne(
    { id: id as string },
    [useTimelinesServiceTimelinesControllerFindOneKey, id as string],
    { enabled: !!id }
  );

  useEffect(() => {
    if (timelineResponse) {
      setTitle(timelineResponse.title);
      setTimelineType(timelineResponse.timelineType);
      const info = timelineResponse.eventProviderInfo as Record<string, string> | null;
      setIcsUrl(timelineResponse.timelineType === 'Calendar' ? (info?.icsUrl ?? '') : '');
      setVisualOrder(timelineResponse.visualOrder);
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
        id,
        requestBody: {
          title,
          timelineType,
          eventProviderInfo: timelineType === 'Calendar' ? { icsUrl } : {},
          visualOrder,
        },
      });
      toast('Timeline has been updated', { type: 'success' });
    } else {
      await createTimeline({
        requestBody: {
          title,
          timelineType,
          eventProviderInfo: timelineType === 'Calendar' ? { icsUrl } : {},
          visualOrder,
        },
      });
      toast('Timeline has been created', { type: 'success' });
    }

    handleClose();
  };

  return (
    <Modal
      open={true}
      onClose={handleClose}
      classNames={{ modal: 'c-edit-timeline-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Update timeline' : 'Add timeline'}</h3>

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
          <h4 className="mt-4">Calendar ICS link</h4>
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
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setVisualOrder(Number(evt.target.value))}
      />

      <div className="flex flex-row justify-end gap-2 mt-8">
        <button className="c-button" onClick={handleClose}>
          Cancel
        </button>
        <button className="c-button" disabled={!title} onClick={handleSave}>
          Save
        </button>
      </div>
    </Modal>
  );
}

export default EditTimelineModal;
