import './OverviewsPage.css';
import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ROUTE_PARTS } from '../../App';
import { overviewsApi } from '../../api/overviews';
import { PREDEFINED_OVERVIEW_CONFIGS } from './predefined-configs';

export function OverviewsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: customConfigs, refetch } = useQuery({
    queryKey: ['overviews'],
    queryFn: overviewsApi.findAll,
  });

  // Refetch the custom overview list whenever the create/edit modal route closes
  useEffect(() => {
    refetch();
  }, [location]);

  return (
    <div className="m-overviews-page">
      <div className="m-overviews-sidebar">
        <div className="m-overviews-sidebar__header">
          <h2 className="m-overviews-sidebar__title">Overviews</h2>
          <p className="m-overviews-sidebar__description">Pivot-table analysis of tracked time</p>
        </div>

        <nav className="m-overviews-sidebar__nav">
          <div className="m-overviews-sidebar__label">Predefined</div>
          {PREDEFINED_OVERVIEW_CONFIGS.map(({ id, label, icon: Icon }) => (
            <NavLink
              key={id}
              to={'/' + ROUTE_PARTS.overviews + '/' + id}
              className="m-overviews-nav-item"
            >
              <Icon size={16} className="m-overviews-nav-item__icon" />
              <span>{label}</span>
            </NavLink>
          ))}

          <div className="m-overviews-sidebar__label m-overviews-sidebar__label--custom">Custom</div>
          {(customConfigs ?? []).map((config) => (
            <NavLink
              key={config.id}
              to={'/' + ROUTE_PARTS.overviews + '/' + config.id}
              className="m-overviews-nav-item"
            >
              <span>{config.name}</span>
            </NavLink>
          ))}
          <button
            className="m-overviews-sidebar__add"
            onClick={() => navigate('/' + ROUTE_PARTS.overviews + '/' + ROUTE_PARTS.new)}
          >
            <Plus size={16} />
            <span>New custom overview</span>
          </button>
        </nav>
      </div>

      <div className="m-overviews-content">
        <Outlet />
      </div>
    </div>
  );
}
