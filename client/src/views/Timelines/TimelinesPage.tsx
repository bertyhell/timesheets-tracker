import './TimelinesPage.scss';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  useTimelinesServiceTimelinesControllerDelete,
  useTimelinesServiceTimelinesControllerFindAll,
  useTimelinesServiceTimelinesControllerFindAllKey,
} from '../../generated/api/queries';
import React, { type ReactNode, useEffect, useState } from 'react';
import { ROUTE_PARTS } from '../../App';
import { toast } from 'react-toastify';
import { orderBy } from 'lodash-es';

function TimelinesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState<'title' | 'timelineType' | 'visualOrder'>('visualOrder');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: 'title' | 'timelineType' | 'visualOrder') => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const indicator = (col: 'title' | 'timelineType' | 'visualOrder') =>
    sortCol === col ? (
      <span style={{ fontSize: '0.7em', color: 'black' }}>{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
    ) : null;

  const { data: timelines, refetch: refetchTimelines } =
    useTimelinesServiceTimelinesControllerFindAll(
      { term: '' },
      [useTimelinesServiceTimelinesControllerFindAllKey],
      { refetchOnMount: true }
    );
  const { mutateAsync: deleteTimeline } = useTimelinesServiceTimelinesControllerDelete();

  useEffect(() => {
    refetchTimelines();
  }, [location]);

  return (
    <div className="p-timelines">
      <div className="m-page-header">
        <h2>Timelines</h2>
        <button
          className="c-button"
          onClick={() =>
            navigate(
              '/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.timelines + '/' + ROUTE_PARTS.create
            )
          }
        >
          Add timeline
        </button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th className="text-left pl-3 cursor-pointer select-none" onClick={() => handleSort('title')}>
              Title{indicator('title')}
            </th>
            <th className="text-left pl-3 cursor-pointer select-none" onClick={() => handleSort('timelineType')}>
              Type{indicator('timelineType')}
            </th>
            <th className="text-left pl-3 cursor-pointer select-none" onClick={() => handleSort('visualOrder')}>
              Order{indicator('visualOrder')}
            </th>
            <th className="w-px whitespace-nowrap"></th>
            <th className="w-px whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {orderBy(timelines || [], (t) => sortCol === 'title' ? t.title?.toLowerCase() : t[sortCol], sortDir).map(
            (timeline): ReactNode => (
              <tr
                key={'timeline-' + timeline.id}
                onClick={() =>
                  navigate(
                    '/' +
                      ROUTE_PARTS.settings +
                      '/' +
                      ROUTE_PARTS.timelines +
                      '/' +
                      timeline.id +
                      '/' +
                      ROUTE_PARTS.edit
                  )
                }
              >
                <td className="pl-3">{timeline.title}</td>
                <td className="pl-3">{timeline.timelineType}</td>
                <td className="pl-3">{timeline.visualOrder}</td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(
                        '/' +
                          ROUTE_PARTS.settings +
                          '/' +
                          ROUTE_PARTS.timelines +
                          '/' +
                          timeline.id +
                          '/' +
                          ROUTE_PARTS.edit
                      );
                    }}
                  >
                    EDIT
                  </button>
                </td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (timeline.id) {
                        await deleteTimeline({ id: timeline.id });
                        await refetchTimelines();
                        toast('Timeline has been deleted', { type: 'success' });
                      } else {
                        toast('Timeline could not be deleted, no id has been set', {
                          type: 'warning',
                        });
                      }
                    }}
                  >
                    DELETE
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <Outlet />
    </div>
  );
}

export default TimelinesPage;
