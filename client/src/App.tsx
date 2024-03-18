import './App.scss';

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import DateSelect from './components/DateSelect/DateSelect';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import GlobalSearchBar from './components/GlobalSearchBar/GlobalSearchBar';

export enum ROUTE_PARTS {
  timelines = 'timelines',
  autoTagRules = 'auto-tag-rules',
  tagNames = 'tag-names',
  create = 'create',
  edit = 'edit',
}

function App() {
  return (
    <div>
      <nav className="m-main-navigation">
        <div className="c-tabs">
          <NavLink to={'/' + ROUTE_PARTS.timelines}>timeline</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.autoTagRules}>auto tag rules</NavLink>
          <NavLink to={'/' + ROUTE_PARTS.tagNames}>tag names</NavLink>
        </div>
        <GlobalSearchBar />
        <DateSelect />
      </nav>
      <Outlet />
      <ToastContainer position={'bottom-left'} theme="dark" />
    </div>
  );
}

export default App;
