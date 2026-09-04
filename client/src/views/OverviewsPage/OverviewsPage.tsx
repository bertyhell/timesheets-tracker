import './OverviewsPage.css';
import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { ROUTE_PARTS } from '../../App';
import { overviewsApi } from '../../api/overviews';
import { findReport, REPORT_GROUPS, REPORTS } from './reports/report-catalog';
import { Dropdown } from '../../components/Dropdown/Dropdown';
import { headerActionsAtom } from '../../store/store';

export function OverviewsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const headerActions = useAtomValue(headerActionsAtom);

  const { data: customConfigs, refetch } = useQuery({
    queryKey: ['overviews'],
    queryFn: overviewsApi.findAll,
  });

  // Refetch the custom overview list whenever the create/edit modal route closes
  useEffect(() => {
    refetch();
  }, [location]);

  const restOfPath = location.pathname
    .split('/')
    .filter(Boolean)
    .slice(1);
  const configId =
    restOfPath.length === 1 && restOfPath[0] !== ROUTE_PARTS.new ? restOfPath[0] : undefined;

  const selectedReport = findReport(configId);
  const selectedCustom = (customConfigs ?? []).find((config) => config.id === configId);
  const selectedLabel = selectedReport?.label ?? selectedCustom?.name ?? 'Select report';

  return (
    <div className="m-overviews-page">
      <div className="m-overviews-topbar">
        <div className="m-overviews-topbar__title">
          <h2 className="m-overviews-topbar__heading">Overviews</h2>
          <p className="m-overviews-topbar__description">Charted reports over your tracked time</p>
        </div>

        <div className="m-overviews-topbar__controls">
          <Dropdown
            label={selectedLabel}
            className="m-overviews-topbar__template"
            panelClassName="m-overviews-template-panel"
          >
            {(close) => (
              <>
                {Object.values(REPORT_GROUPS).map((group) => (
                  <React.Fragment key={group}>
                    <div className="m-overviews-template-panel__label">{group}</div>
                    {REPORTS.filter((report) => report.group === group).map(
                      ({ id, label, description, icon: Icon }) => (
                        <button
                          key={id}
                          title={description}
                          className={`m-overviews-template-panel__item${configId === id ? ' is-active' : ''}`}
                          onClick={() => {
                            navigate('/' + ROUTE_PARTS.overviews + '/' + id);
                            close();
                          }}
                        >
                          <Icon size={16} className="m-overviews-template-panel__icon" />
                          <span>{label}</span>
                        </button>
                      )
                    )}
                  </React.Fragment>
                ))}

                <div className="m-overviews-template-panel__label m-overviews-template-panel__label--custom">
                  Saved
                </div>
                {(customConfigs ?? []).length === 0 && (
                  <div className="m-overviews-template-panel__empty">No saved overviews yet</div>
                )}
                {(customConfigs ?? []).map((config) => (
                  <button
                    key={config.id}
                    className={`m-overviews-template-panel__item${configId === config.id ? ' is-active' : ''}`}
                    onClick={() => {
                      navigate('/' + ROUTE_PARTS.overviews + '/' + config.id);
                      close();
                    }}
                  >
                    <span>{config.name}</span>
                  </button>
                ))}

                <button
                  className="m-overviews-template-panel__add"
                  onClick={() => {
                    navigate('/' + ROUTE_PARTS.overviews + '/' + ROUTE_PARTS.new);
                    close();
                  }}
                >
                  <Plus size={16} />
                  <span>New saved overview</span>
                </button>
              </>
            )}
          </Dropdown>

          {headerActions}
        </div>
      </div>

      <div className="m-overviews-content">
        <Outlet />
      </div>
    </div>
  );
}
