import './NotesPage.css';
import React, { type ReactNode, useEffect, useState } from 'react';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { ROUTE_PARTS } from '../../../App';
import {
  useAutoNotesServiceAutoNotesControllerFindAll,
  useAutoNotesServiceAutoNotesControllerRemove,
} from '../../../generated/api/queries';
import type { AutoNote } from '../../../types/types';
import { orderBy } from 'lodash-es';

// interface NotesPageProps {}

export function NotesPage() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;
  const [_selectedNote, setSelectedNote] = useState<AutoNote | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  const sortIndicator = (
    <span style={{ fontSize: '0.7em', color: 'black' }}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
  );

  const { data: notes, refetch: refetchNotes } = useAutoNotesServiceAutoNotesControllerFindAll({
    term: '',
  });
  const { mutateAsync: deleteNote } = useAutoNotesServiceAutoNotesControllerRemove();

  useEffect(() => {
    if (notes) {
      const noteFromUrl = (notes.find((note) => note.id === id) || null) as AutoNote | null;
      setSelectedNote(noteFromUrl);
    }
  }, [id, notes]);

  return (
    <div className="p-tag-names">
      <PageHeader
        title="Auto notes"
        description="This allows you to define what should be added to the notes of an auto tag. You can copy the name of the program or maybe some commit messages. or even use a regex to extract some info from one of the available variables (wip)."
      >
        <button
          className="c-button"
          onClick={() =>
            navigate(
              '/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.notes + '/' + ROUTE_PARTS.create
            )
          }
        >
          Add auto note
        </button>
      </PageHeader>
      <table className="c-table w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th className="text-left pl-3 cursor-pointer select-none" onClick={toggleSort}>
              Title{sortIndicator}
            </th>
            <th className="w-px whitespace-nowrap"></th>
            <th className="w-px whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {orderBy(notes || [], (n) => n.title?.toLowerCase(), sortDir).map(
            (note): ReactNode => (
              <tr
                key={'note-' + note.id}
                onClick={() =>
                  navigate(
                    '/' +
                      ROUTE_PARTS.settings +
                      '/' +
                      ROUTE_PARTS.notes +
                      '/' +
                      note.id +
                      '/' +
                      ROUTE_PARTS.edit
                  )
                }
              >
                <td className="pl-3">{note.title}</td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNote(note as unknown as AutoNote);
                      navigate(
                        '/' +
                          ROUTE_PARTS.settings +
                          '/' +
                          ROUTE_PARTS.notes +
                          '/' +
                          note.id +
                          '/' +
                          ROUTE_PARTS.edit
                      );
                    }}
                  >
                    EDIT
                  </button>
                </td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={async (e) => {
                      e.stopPropagation();
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
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <Outlet />
    </div>
  );
}
