import './App.css';

import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAtom } from 'jotai';
import { sidebarCollapsedAtom } from './store/store';
import {
  Clock,
  BarChart2,
  Calendar,
  List,
  Tag,
  Zap,
  Filter,
  FileText,
  Settings,
  User,
  ChevronDown,
} from 'lucide-react';

export enum ROUTE_PARTS {
  timelinesAndEvents = 'timelines-and-events',
  settings = 'settings',
  timelines = 'timelines',
  autoTagRules = 'auto-tag-rules',
  tagNames = 'tag-names',
  notes = 'notes',
  calendars = 'calendars',
  create = 'create',
  edit = 'edit',
}

const OVERVIEW_NAV = [{ to: ROUTE_PARTS.timelinesAndEvents, label: 'Overview', icon: BarChart2 }];

const MANAGE_NAV = [
  { to: ROUTE_PARTS.settings + '/' + ROUTE_PARTS.timelines, label: 'Timelines', icon: List },
  { to: ROUTE_PARTS.settings + '/' + ROUTE_PARTS.tagNames, label: 'Tags', icon: Tag },
  { to: ROUTE_PARTS.settings + '/' + ROUTE_PARTS.autoTagRules, label: 'Auto Tags', icon: Zap },
  { to: ROUTE_PARTS.settings + '/' + ROUTE_PARTS.notes, label: 'Notes', icon: FileText },
];

function App() {
  const location = useLocation();
  const isFullLayoutPage = location.pathname.startsWith('/' + ROUTE_PARTS.timelinesAndEvents);
  const [sidebarCollapsed] = useAtom(sidebarCollapsedAtom);

  return (
    <div className="m-app">
      {!sidebarCollapsed && (
        <nav className="m-main-navigation">
          {/* Logo */}
          <div className="m-nav-logo">
            <div className="m-nav-logo__icon">
              <Clock size={20} />
            </div>
            <span className="m-nav-logo__text">Timesheet Tracker</span>
          </div>

          <div className="m-nav-sections">
            {/* Overview */}
            <div className="m-nav-section">
              <div className="m-nav-section__label">Overview</div>
              {OVERVIEW_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={'/' + to} className="m-nav-item">
                  <Icon size={16} className="m-nav-item__icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Manage */}
            <div className="m-nav-section">
              <div className="m-nav-section__label">Manage</div>
              {MANAGE_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={'/' + to} className="m-nav-item">
                  <Icon size={16} className="m-nav-item__icon" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      )}

      <div className={`m-page-content${isFullLayoutPage ? ' m-page-content--full' : ''}`}>
        <Outlet />
      </div>

      <ToastContainer position={'bottom-left'} theme="light" />
    </div>
  );
}

export default App;
