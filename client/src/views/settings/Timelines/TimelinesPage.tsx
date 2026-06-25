import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Button, { ButtonVariant } from '../../../components/Button/Button';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  timelinesControllerDeleteMutation,
  timelinesControllerFindAllOptions,
} from '../../../generated/api/@tanstack/react-query.gen';
import React, { type ReactNode, useEffect, useState } from 'react';
import { ROUTE_PARTS } from '../../../App';
import { toast } from 'react-toastify';
import { orderBy } from 'lodash-es';
import './TimelinesPage.css';

export function TimelinesPage() {
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

  const { data: timelines, refetch: refetchTimelines } = useQuery({
    ...timelinesControllerFindAllOptions(),
    refetchOnMount: true,
  });
  const { mutateAsync: deleteTimeline } = useMutation({ ...timelinesControllerDeleteMutation() });

  useEffect(() => {
    refetchTimelines();
  }, [location]);

  return (
    <div className="p-timelines">
      <PageHeader
        title="Timelines"
        description="Manages the lanes you see on the main timeline overview page. Timelines show you what events or programs were open at what time. You can also configure a timeline for tagging time and even an auto tagging timeline that uses rules to auto tag time."
      >
        <Button
          onClick={() =>
            navigate(
              '/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.timelines + '/' + ROUTE_PARTS.create
            )
          }
          variant={ButtonVariant.Primary}
        >
          Add timeline
        </Button>
      </PageHeader>
      <table className="c-table w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th
              className="text-left pl-3 cursor-pointer select-none"
              onClick={() => handleSort('title')}
            >
              Title{indicator('title')}
            </th>
            <th
              className="text-left pl-3 cursor-pointer select-none"
              onClick={() => handleSort('timelineType')}
            >
              Type{indicator('timelineType')}
            </th>
            <th
              className="text-left pl-3 cursor-pointer select-none"
              onClick={() => handleSort('visualOrder')}
            >
              Order{indicator('visualOrder')}
            </th>
            <th className="w-px whitespace-nowrap"></th>
            <th className="w-px whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {orderBy(
            timelines || [],
            (t) => (sortCol === 'title' ? t.title?.toLowerCase() : t[sortCol]),
            sortDir
          ).map(
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
                  <Button
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
                    variant={ButtonVariant.Secondary}
                  >
                    EDIT
                  </Button>
                </td>
                <td className="w-px whitespace-nowrap">
                  <Button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (timeline.id) {
                        await deleteTimeline({ path: { id: timeline.id } });
                        await refetchTimelines();
                        toast('Timeline has been deleted', { type: 'success' });
                      } else {
                        toast('Timeline could not be deleted, no id has been set', {
                          type: 'warning',
                        });
                      }
                    }}
                    variant={ButtonVariant.Secondary}
                  >
                    DELETE
                  </Button>
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
