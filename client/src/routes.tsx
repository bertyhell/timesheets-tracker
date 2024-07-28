import App, { ROUTE_PARTS } from './App';
import TimelinesPage from './views/TimelinesPage/TimelinesPage';
import AutoTagsPage from './views/AutoTagsPage/AutoTagsPage';
import EditAutoTagModal from './components/EditAutoTagModal/EditAutoTagModal';
import TagNamesPage from './views/TagNamesPage/TagNamesPage';
import EditTagNameModal from './components/EditTagNameModal/EditTagNameModal';
import React from 'react';
import { redirect, type RouteObject } from 'react-router-dom';
import NotesPage from './views/NotesPage/NotesPage';
import EditAutoNoteModal from './components/EditNoteModal/EditAutoNoteModal';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        loader: () => redirect('/' + ROUTE_PARTS.timelines),
      },
      {
        path: ROUTE_PARTS.timelines,
        element: <TimelinesPage />,
      },
      {
        path: ROUTE_PARTS.autoTagRules,
        element: <AutoTagsPage />,
        children: [
          {
            path: ROUTE_PARTS.create,
            element: <EditAutoTagModal />,
          },
          {
            path: ':id/' + ROUTE_PARTS.edit,
            element: <EditAutoTagModal />,
          },
        ],
      },
      {
        path: ROUTE_PARTS.tagNames,
        element: <TagNamesPage />,
        children: [
          {
            path: ROUTE_PARTS.create,
            element: <EditTagNameModal />,
          },
          {
            path: ':id/' + ROUTE_PARTS.edit,
            element: <EditTagNameModal />,
          },
        ],
      },
      {
        path: ROUTE_PARTS.notes,
        element: <NotesPage />,
        children: [
          {
            path: ROUTE_PARTS.create,
            element: <EditAutoNoteModal />,
          },
          {
            path: ':id/' + ROUTE_PARTS.edit,
            element: <EditAutoNoteModal />,
          },
        ],
      },
    ],
  },
];
