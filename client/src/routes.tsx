import App, { ROUTE_PARTS } from './App';
import { TimelinesAndEventsPage } from './views/TimelinesAndEventsPage/TimelinesAndEventsPage';
import { AutoTagsPage } from './views/settings/AutoTagsPage/AutoTagsPage';
import { EditAutoTagModal } from './components/EditAutoTagModal/EditAutoTagModal';
import { EditTagModal } from './components/EditTagModal/EditTagModal';
import { BulkTagModal } from './components/BulkTagModal/BulkTagModal';
import { TagNamesPage } from './views/settings/TagNamesPage/TagNamesPage';
import { EditTagNameModal } from './components/EditTagNameModal/EditTagNameModal';
import React from 'react';
import { redirect, type RouteObject } from 'react-router-dom';
import { NotesPage } from './views/settings/NotesPage/NotesPage';
import { EditAutoNoteModal } from './components/EditNoteModal/EditAutoNoteModal';
import { TimelinesPage } from './views/settings/Timelines/TimelinesPage';
import { EditTimelineModal } from './components/EditTimelineModal/EditTimelineModal';
import { SettingsPage } from './views/settings/SettingsPage/SettingsPage';
import { GeneralSettingsPage } from './views/settings/GeneralSettingsPage/GeneralSettingsPage';
import { OverviewsPage } from './views/OverviewsPage/OverviewsPage';
import { OverviewView } from './views/OverviewsPage/OverviewView/OverviewView';
import { EditOverviewConfigModal } from './components/EditOverviewConfigModal/EditOverviewConfigModal';
import { PREDEFINED_OVERVIEW_CONFIGS } from './views/OverviewsPage/predefined-configs';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        loader: () => redirect('/' + ROUTE_PARTS.timelinesAndEvents),
      },
      {
        path: ROUTE_PARTS.timelinesAndEvents,
        element: <TimelinesAndEventsPage />,
        children: [
          {
            path: ROUTE_PARTS.create,
            element: <EditTagModal />,
          },
          {
            path: ':uuid/' + ROUTE_PARTS.edit,
            element: <EditTagModal />,
          },
          {
            path: ROUTE_PARTS.bulkTag,
            element: <BulkTagModal />,
          },
        ],
      },
      {
        path: ROUTE_PARTS.overviews,
        element: <OverviewsPage />,
        children: [
          {
            index: true,
            loader: () =>
              redirect('/' + ROUTE_PARTS.overviews + '/' + PREDEFINED_OVERVIEW_CONFIGS[0].id),
          },
          {
            path: ROUTE_PARTS.new,
            element: <EditOverviewConfigModal />,
          },
          {
            path: ':configId',
            element: <OverviewView />,
          },
          {
            path: ':id/' + ROUTE_PARTS.edit,
            element: <EditOverviewConfigModal />,
          },
        ],
      },
      {
        path: ROUTE_PARTS.settings,
        element: <SettingsPage />,
        children: [
          {
            index: true,
            loader: () => redirect('/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.general),
          },
          {
            path: ROUTE_PARTS.general,
            element: <GeneralSettingsPage />,
          },
        ],
      },
      {
        path: ROUTE_PARTS.manage,
        children: [
          {
            path: ROUTE_PARTS.timelines,
            element: <TimelinesPage />,
            children: [
              {
                path: ROUTE_PARTS.create,
                element: <EditTimelineModal />,
              },
              {
                path: ':id/' + ROUTE_PARTS.edit,
                element: <EditTimelineModal />,
              },
            ],
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
    ],
  },
];
