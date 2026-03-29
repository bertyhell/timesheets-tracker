import './App.scss';

import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import DateSelect from './components/DateSelect/DateSelect';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GlobalSearchBar from './components/GlobalSearchBar/GlobalSearchBar';
import { useAtom } from 'jotai/index';
import { headerActionsAtom } from './store/store';

export enum ROUTE_PARTS {
  timelines = 'timelines',
  autoTagRules = 'auto-tag-rules',
  tagNames = 'tag-names',
  notes = 'notes',
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
          <NavLink to={'/' + ROUTE_PARTS.timelines}>timeline</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.autoTagRules}>auto tag rules</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.tagNames}>tag names</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.notes}>auto notes</NavLink>
        </div>
        {headerActions && <div className="m-header-actions" style={{ marginLeft: 'auto' }}>{headerActions}</div>}
        {isTimelinesTab && <GlobalSearchBar />}
        {isTimelinesTab && <DateSelect />}
      </nav>
      <div className={isTimelinesTab ? undefined : 'm-page-content'}>
        <Outlet />
      </div>
      <ToastContainer position={'bottom-left'} theme="dark" />
    </div>
  );
}

export default App;
