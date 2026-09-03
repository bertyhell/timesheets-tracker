import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Database, Plug, Zap } from 'lucide-react';
import './SettingsPage.css';

const NAV_ITEMS = [
  { to: '/settings/general', label: 'Database', icon: Database },
  { to: '/settings/auto-tags', label: 'Auto tags', icon: Zap },
  { to: '/settings/integrations', label: 'Integrations', icon: Plug },
];

export function SettingsPage() {
  return (
    <div className="m-settings-page">
      <div className="m-settings-sidebar">
        <div className="m-settings-sidebar__header">
          <h2 className="m-settings-sidebar__title">Settings</h2>
          <p className="m-settings-sidebar__description">Manage application preferences</p>
        </div>

        <nav className="m-settings-sidebar__nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="m-settings-nav-item">
              <Icon size={16} className="m-settings-nav-item__icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="m-settings-content">
        <Outlet />
      </div>
    </div>
  );
}
