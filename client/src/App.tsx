import './App.scss';

import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export enum ROUTE_PARTS {
  timelinesAndEvents = 'timelinesAndEvents',
  settings = 'settings',
  timelines = 'timelines',
  autoTagRules = 'auto-tag-rules',
  tagNames = 'tag-names',
  notes = 'notes',
  calendars = 'calendars',
  create = 'create',
  edit = 'edit',
}

const SETTINGS_TABS = [
  { to: ROUTE_PARTS.timelines, label: 'Timelines' },
  { to: ROUTE_PARTS.autoTagRules, label: 'Auto tag rules' },
  { to: ROUTE_PARTS.tagNames, label: 'Tag names' },
  { to: ROUTE_PARTS.notes, label: 'Auto notes' },
  { to: ROUTE_PARTS.calendars, label: 'Calendars' },
];

function App() {
  const location = useLocation();
  const isFullLayoutPage = location.pathname.startsWith('/' + ROUTE_PARTS.timelinesAndEvents);
  const isSettingsPage = location.pathname.startsWith('/' + ROUTE_PARTS.settings);
  const [settingsExpanded, setSettingsExpanded] = useState(isSettingsPage);

  useEffect(() => {
    if (isSettingsPage) {
      setSettingsExpanded(true);
    }
  }, [isSettingsPage]);

  return (
    <div className="m-app">
      <nav className="m-main-navigation">
        <div className="m-nav-links">
          <NavLink to={'/' + ROUTE_PARTS.timelinesAndEvents}>timeline and events</NavLink>

          <button
            className={`m-settings-toggle${isSettingsPage ? ' active' : ''}`}
            onClick={() => setSettingsExpanded((prev) => !prev)}
            aria-expanded={settingsExpanded}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="m-gear-icon">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`m-chevron-icon${settingsExpanded ? ' expanded' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {settingsExpanded && (
            <div className="m-settings-sub-nav">
              {SETTINGS_TABS.map(({ to, label }) => (
                <NavLink key={to} to={'/' + ROUTE_PARTS.settings + '/' + to}>
                  {label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className={`m-page-content${isFullLayoutPage ? ' m-page-content--full' : ''}`}>
        <Outlet />
      </div>

      <ToastContainer position={'bottom-left'} theme="dark" />
    </div>
  );
}

export default App;
