import './App.scss';

import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import DateSelect from './components/DateSelect/DateSelect';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GlobalSearchBar from './components/GlobalSearchBar/GlobalSearchBar';
import { useAtom } from 'jotai';
import { headerActionsAtom } from './store/store';

export enum ROUTE_PARTS {
  timelinesAndEvents = 'timelinesAndEvents',
  timelines = 'timelines',
  autoTagRules = 'auto-tag-rules',
  tagNames = 'tag-names',
  notes = 'notes',
  calendars = 'calendars',
  create = 'create',
  edit = 'edit',
}

function App() {
  const location = useLocation();
  const isTimelinesTab = location.pathname.startsWith('/' + ROUTE_PARTS.timelines);
  const [headerActions] = useAtom(headerActionsAtom);

  return (
    <div>
      <nav className="m-main-navigation">
        <div className="c-tabs">
          <NavLink to={'/' + ROUTE_PARTS.timelinesAndEvents}>timeline and events</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.timelines}>timelines</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.autoTagRules}>auto tag rules</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.tagNames}>tag names</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.notes}>auto notes</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.calendars}>calendars</NavLink>
        </div>
        {headerActions && (
          <div className="m-header-actions" style={{ marginLeft: 'auto' }}>
            {headerActions}
          </div>
        )}
        {isTimelinesTab && <GlobalSearchBar />}
        {isTimelinesTab && <DateSelect className="c-view-date" />}
      </nav>
      <div className={isTimelinesTab ? undefined : 'm-page-content'}>
        <Outlet />
      </div>
      <ToastContainer position={'bottom-left'} theme="dark" />
    </div>
  );
}

export default App;
