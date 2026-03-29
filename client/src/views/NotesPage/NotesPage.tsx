import './NotesPage.scss';
import React, { type ReactNode, useEffect, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { ROUTE_PARTS } from '../../App';
import {
  useAutoNotesServiceAutoNotesControllerFindAll,
  useAutoNotesServiceAutoNotesControllerRemove,
} from '../../generated/api/queries';
import type { AutoNote } from '../../types/types';

// interface NotesPageProps {}

function NotesPage() {
  const navigate = useNavigate();
  const params = useParams();
  // const action = params.action;
  const id = params.id;
  const [_selectedNote, setSelectedNote] = useState<AutoNote | null>(null);

  const { data: notes, refetch: refetchNotes } = useAutoNotesServiceAutoNotesControllerFindAll({
    term: '',
  });
  const { mutateAsync: deleteNote } = useAutoNotesServiceAutoNotesControllerRemove();

  useEffect(() => {
    if (notes) {
      // Set autoTag from url id
      const noteFromUrl = (notes.find((note) => note.id === id) || null) as AutoNote | null;
      setSelectedNote(noteFromUrl);
    }
  }, [id, notes]);

  return (
    <div className="p-tag-names">
      <button
        className="c-button"
        onClick={() => navigate('/' + ROUTE_PARTS.notes + '/' + ROUTE_PARTS.create)}
      >
        Add note
      </button>

      <ul>
        {(notes || []).map(
          (note): ReactNode => (
            <li className="c-row" key={'tag-name-' + note.id}>
              <span className="flex-grow">{note.title}</span>
              <button
                className="c-button"
                onClick={() => {
                  setSelectedNote(note as unknown as AutoNote);
                  navigate('/' + ROUTE_PARTS.notes + '/' + note.id + '/' + ROUTE_PARTS.edit);
                }}
              >
                EDIT
              </button>
              <button
                className="c-button"
                onClick={async () => {
                  if (note.id) {
                    await deleteNote({
                      id: note.id,
                    });
                    await refetchNotes();

                    toast('Note has been deleted', { type: 'success' });
                  } else {
                    toast('Note could not be deleted, no id has been set', { type: 'warning' });
                  }
                }}
              >
                DELETE
              </button>
            </li>
          )
        )}
      </ul>

      <Outlet />
    </div>
  );
}

export default NotesPage;
