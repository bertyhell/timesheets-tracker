import './EditTimelineModal.scss';

import React, { type ChangeEvent, useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { ROUTE_PARTS } from '../../App';
import {
  useTimelinesServiceTimelinesControllerCreate,
  useTimelinesServiceTimelinesControllerFindOne,
  useTimelinesServiceTimelinesControllerFindOneKey,
  useTimelinesServiceTimelinesControllerUpdate,
} from '../../generated/api/queries';
import type { TimelineType } from '../../generated/api/requests/types.gen';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const TIMELINE_TYPES: TimelineType[] = [
  'Program',
  'Website',
  'Tag',
  'AutoTag',
  'Calendar',
  'ActiveState',
];

function EditTimelineModal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('');
  const [timelineType, setTimelineType] = useState<TimelineType>('Program');
  const [eventProviderInfo, setEventProviderInfo] = useState<string>('');
  const [order, setOrder] = useState<number>(0);

  const { mutateAsync: createTimeline } = useTimelinesServiceTimelinesControllerCreate();
  const { mutateAsync: updateTimeline } = useTimelinesServiceTimelinesControllerUpdate();
  const { data: timelineResponse } = useTimelinesServiceTimelinesControllerFindOne(
    { id: id as string },
    [useTimelinesServiceTimelinesControllerFindOneKey, id as string],
    { enabled: !!id }
  );

  useEffect(() => {
    if (timelineResponse) {
      setTitle(timelineResponse.title);
      setTimelineType(timelineResponse.timelineType);
      setEventProviderInfo(JSON.stringify(timelineResponse.eventProviderInfo));
      setOrder(timelineResponse.order);
    }
  }, [timelineResponse]);

  const handleClose = () => navigate('/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.timelines);

  const handleSave = async () => {
    if (id) {
      await updateTimeline({
        id,
        requestBody: {
          title,
          timelineType,
          eventProviderInfo,
          order,
        },
      });
      toast('Timeline has been updated', { type: 'success' });
    } else {
      await createTimeline({
        requestBody: {
          title,
          timelineType,
          eventProviderInfo,
          order,
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

      <h4 className="mt-4">Title</h4>
      <input
        className="c-input"
        value={title}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setTitle(evt.target.value)}
      />

      <h4 className="mt-4">Type</h4>
      <select
        className="c-input"
        value={timelineType}
        onChange={(evt: ChangeEvent<HTMLSelectElement>) =>
          setTimelineType(evt.target.value as TimelineType)
        }
      >
        {TIMELINE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      <h4 className="mt-4">Event provider info</h4>
      <input
        className="c-input"
        value={eventProviderInfo}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setEventProviderInfo(evt.target.value)}
        placeholder="e.g. a URL or identifier"
      />

      <h4 className="mt-4">Order</h4>
      <input
        className="c-input"
        type="number"
        value={order}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setOrder(Number(evt.target.value))}
      />

      <div className="flex flex-row justify-end gap-2 mt-8">
        <button className="c-button" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="c-button"
          disabled={!title}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

export default EditTimelineModal;
