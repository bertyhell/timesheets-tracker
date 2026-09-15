import React from 'react';
import { redirect, type RouteObject } from 'react-router-dom';

import App, { ROUTE_PARTS } from './App';
import { BulkTagModal } from './components/BulkTagModal/BulkTagModal';
import { EditAutoTagModal } from './components/EditAutoTagModal/EditAutoTagModal';
import { EditAutoNoteModal } from './components/EditNoteModal/EditAutoNoteModal';
import { EditOverviewConfigModal } from './components/EditOverviewConfigModal/EditOverviewConfigModal';
import { EditTagModal } from './components/EditTagModal/EditTagModal';
import { EditTagNameModal } from './components/EditTagNameModal/EditTagNameModal';
import { EditTimelineModal } from './components/EditTimelineModal/EditTimelineModal';
import { OverviewsPage } from './views/OverviewsPage/OverviewsPage';
import { OverviewView } from './views/OverviewsPage/OverviewView/OverviewView';
import { DEFAULT_REPORT_ID } from './views/OverviewsPage/reports/report-catalog';
import { AutoTagsPage } from './views/settings/AutoTagsPage/AutoTagsPage';
import { AutoTagsSettingsPage } from './views/settings/AutoTagsSettingsPage/AutoTagsSettingsPage';
import { BackupSettingsPage } from './views/settings/BackupSettingsPage/BackupSettingsPage';
import { GeneralSettingsPage } from './views/settings/GeneralSettingsPage/GeneralSettingsPage';
import { ExcelCsvSettingsPage } from './views/settings/IntegrationsPage/ExcelCsvSettingsPage';
import { IntegrationsPage } from './views/settings/IntegrationsPage/IntegrationsPage';
import { JiraSettingsPage } from './views/settings/IntegrationsPage/JiraSettingsPage';
import { ProductiveSettingsPage } from './views/settings/IntegrationsPage/ProductiveSettingsPage';
import { NotesPage } from './views/settings/NotesPage/NotesPage';
import { SettingsPage } from './views/settings/SettingsPage/SettingsPage';
import { TagNamesPage } from './views/settings/TagNamesPage/TagNamesPage';
import { TimelinesPage } from './views/settings/Timelines/TimelinesPage';
import { UpdatesPage } from './views/settings/UpdatesPage/UpdatesPage';
import { TimelinesAndEventsPage } from './views/TimelinesAndEventsPage/TimelinesAndEventsPage';

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
            loader: () => redirect('/' + ROUTE_PARTS.overviews + '/' + DEFAULT_REPORT_ID),
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
          {
            path: ROUTE_PARTS.autoTags,
            element: <AutoTagsSettingsPage />,
          },
          {
            path: ROUTE_PARTS.integrations,
            element: <IntegrationsPage />,
          },
          {
            path: ROUTE_PARTS.integrations + '/' + ROUTE_PARTS.productive,
            element: <ProductiveSettingsPage />,
          },
          {
            path: ROUTE_PARTS.integrations + '/' + ROUTE_PARTS.jira,
            element: <JiraSettingsPage />,
          },
          {
            path: ROUTE_PARTS.integrations + '/' + ROUTE_PARTS.excelCsv,
            element: <ExcelCsvSettingsPage />,
          },
          {
            path: ROUTE_PARTS.backup,
            element: <BackupSettingsPage />,
          },
          {
            path: ROUTE_PARTS.updates,
            element: <UpdatesPage />,
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
