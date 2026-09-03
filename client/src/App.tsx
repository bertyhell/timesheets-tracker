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
  LayoutGrid,
} from 'lucide-react';

export enum ROUTE_PARTS {
  timelinesAndEvents = 'timelines-and-events',
  settings = 'settings',
  manage = 'manage',
  general = 'general',
  timelines = 'timelines',
  autoTagRules = 'auto-tag-rules',
  autoTags = 'auto-tags',
  tagNames = 'tag-names',
  notes = 'notes',
  calendars = 'calendars',
  create = 'create',
  edit = 'edit',
  bulkTag = 'bulk-tag',
  overviews = 'overviews',
  new = 'new',
  integrations = 'integrations',
  productive = 'productive',
}

const OVERVIEW_NAV = [{ to: ROUTE_PARTS.timelinesAndEvents, label: 'Overview', icon: BarChart2 }];

const OVERVIEWS_NAV = [{ to: ROUTE_PARTS.overviews, label: 'Overviews', icon: LayoutGrid }];

const MANAGE_NAV = [
  { to: ROUTE_PARTS.manage + '/' + ROUTE_PARTS.timelines, label: 'Timelines', icon: List },
  { to: ROUTE_PARTS.manage + '/' + ROUTE_PARTS.tagNames, label: 'Tags', icon: Tag },
  { to: ROUTE_PARTS.manage + '/' + ROUTE_PARTS.autoTagRules, label: 'Auto Tags', icon: Zap },
  { to: ROUTE_PARTS.manage + '/' + ROUTE_PARTS.notes, label: 'Notes', icon: FileText },
];

const GENERAL_NAV = [
  { to: ROUTE_PARTS.settings + '/' + ROUTE_PARTS.general, label: 'General', icon: Settings },
];

function App() {
  const location = useLocation();
  const isFullLayoutPage =
    location.pathname.startsWith('/' + ROUTE_PARTS.timelinesAndEvents) ||
    location.pathname.startsWith('/' + ROUTE_PARTS.overviews);
  const [sidebarCollapsed] = useAtom(sidebarCollapsedAtom);

  return (
    <div className="m-app">
      {!sidebarCollapsed && (
        <nav className="m-main-navigation">
          {/* Logo */}
          <div className="m-nav-logo">
            <div className="m-nav-logo__icon">
              <svg width="22" height="22" viewBox="0 0 512 512" role="img" xmlns="http://www.w3.org/2000/svg">
                <circle cx="256" cy="276" r="224" fill="#111"/>
                <circle cx="256" cy="66"  r="59"  fill="#111"/>
                <circle cx="121" cy="115" r="59"  fill="#111"/>
                <circle cx="391" cy="115" r="59"  fill="#111"/>
                <circle cx="256" cy="276" r="210" fill="#7c3aed"/>
                <circle cx="256" cy="66"  r="45"  fill="#7c3aed"/>
                <circle cx="121" cy="115" r="45"  fill="#7c3aed"/>
                <circle cx="391" cy="115" r="45"  fill="#7c3aed"/>
                <circle cx="256" cy="276" r="163" fill="white"/>
                <path d="M 256,276 L 256,96 A 180,180 0 0,1 436,276 Z" fill="#7c3aed"/>
              </svg>
            </div>
            <div className="m-nav-logo__text-group">
              <span className="m-nav-logo__label">Timesheet</span>
              <span className="m-nav-logo__title">Tracker</span>
            </div>
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

            {/* Overviews */}
            <div className="m-nav-section">
              <div className="m-nav-section__label">Analysis</div>
              {OVERVIEWS_NAV.map(({ to, label, icon: Icon }) => (
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

            {/* General */}
            <div className="m-nav-section">
              <div className="m-nav-section__label">Settings</div>
              {GENERAL_NAV.map(({ to, label, icon: Icon }) => (
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
