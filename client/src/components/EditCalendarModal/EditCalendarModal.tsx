import './EditCalendarModal.scss';

import React, { type ChangeEvent, useEffect, useState } from 'react';
import { Modal } from 'react-responsive-modal';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { ROUTE_PARTS } from '../../App';
import {
  useCalendarsServiceCalendarsControllerCreate,
  useCalendarsServiceCalendarsControllerFindOne,
  useCalendarsServiceCalendarsControllerFindOneKey,
  useCalendarsServiceCalendarsControllerUpdate,
} from '../../generated/api/queries';
import { type CalendarDto } from '../../generated/api/requests/types.gen';
import { ColorInput } from '../ColorInput/ColorInput';

function EditCalendarModal() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [color, setColor] = useState<string>('#3b82f6');

  const { mutateAsync: createCalendar } = useCalendarsServiceCalendarsControllerCreate();
  const { mutateAsync: updateCalendar } = useCalendarsServiceCalendarsControllerUpdate();

  const { data: calendarResponse } = useCalendarsServiceCalendarsControllerFindOne(
    { id: id as string },
    [useCalendarsServiceCalendarsControllerFindOneKey, id as string],
    { enabled: !!id }
  );
  const calendar = calendarResponse as CalendarDto | undefined;

  useEffect(() => {
    if (calendar) {
      setTitle(calendar.title);
      setUrl(calendar.url);
      setColor(calendar.color);
    }
  }, [calendar]);

  const handleClose = () => navigate('/' + ROUTE_PARTS.calendars);

  const handleSave = async () => {
    if (id) {
      await updateCalendar({
        id,
        requestBody: { title, url, color },
      });
      toast('Calendar has been updated', { type: 'success' });
    } else {
      await createCalendar({
        requestBody: { title, url, color },
      });
      toast('Calendar has been created', { type: 'success' });
    }
    handleClose();
  };

  return (
    <Modal
      open
      onClose={handleClose}
      classNames={{ modal: 'c-edit-tag-name-modal', closeButton: 'c-button c-button--small' }}
    >
      <h3>{id ? 'Update calendar' : 'Add calendar'}</h3>

      <h4 className="mt-4">Title</h4>
      <input
        className="c-input"
        value={title}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setTitle(evt.target.value)}
      />

      <h4 className="mt-4 flex justify-between items-baseline">
        URL to .ics file
        <a
          href="https://www.onecal.io/blog/how-to-get-an-ics-url-for-your-calendar"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'darkslategray', textDecoration: 'underline', fontSize: '0.8rem', fontWeight: 'normal' }}
        >
          (how do I get this url)
        </a>
      </h4>
      <input
        className="c-input"
        value={url}
        placeholder="https://example.com/calendar.ics"
        onChange={(evt: ChangeEvent<HTMLInputElement>) => setUrl(evt.target.value)}
      />

      <h4 className="mt-4">Color</h4>
      <ColorInput color={color} onChange={setColor} />

      <div className="flex flex-row justify-end gap-2 mt-4">
        <button className="c-button" onClick={handleClose}>
          Cancel
        </button>
        <button
          className="c-button"
          disabled={!title || !url}
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </Modal>
  );
}

export default EditCalendarModal;
