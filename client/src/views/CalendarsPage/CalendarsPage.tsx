import './CalendarsPage.scss';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  useCalendarsServiceCalendarsControllerDelete,
  useCalendarsServiceCalendarsControllerFindAll,
} from '../../generated/api/queries';
import React, { type ReactNode, useEffect } from 'react';
import { ROUTE_PARTS } from '../../App';
import { toast } from 'react-toastify';
import { type CalendarDto } from '../../generated/api/requests/types.gen';

function maskCalendarUrl(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname + '/***';
  } catch {
    return '***';
  }
}

function CalendarsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: calendars, refetch: refetchCalendars } =
    useCalendarsServiceCalendarsControllerFindAll();

  const { mutateAsync: deleteCalendar } = useCalendarsServiceCalendarsControllerDelete();

  useEffect(() => {
    refetchCalendars();
  }, [location]);

  return (
    <div>
      <div className="m-page-header">
        <h2>Calendars</h2>
        <NavLink className="c-button" to={'/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.calendars + '/' + ROUTE_PARTS.create}>
          Add calendar
        </NavLink>
      </div>
      <table className="w-full">
        <thead>
          <tr className="h-10 bg-white">
            <th className="w-px"></th>
            <th className="text-left pl-3">Title</th>
            <th className="text-left pl-3">URL</th>
            <th className="w-px whitespace-nowrap"></th>
            <th className="w-px whitespace-nowrap"></th>
          </tr>
        </thead>
        <tbody>
          {((calendars as CalendarDto[]) || []).map(
            (calendar): ReactNode => (
              <tr
                key={'calendar-' + calendar.id}
                onClick={() =>
                  navigate('/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.calendars + '/' + calendar.id + '/' + ROUTE_PARTS.edit)
                }
              >
                <td className="w-px py-1 pl-2">
                  <span
                    className="block w-16 h-16"
                    style={{ backgroundColor: calendar.color }}
                  ></span>
                </td>
                <td className="pl-3">{calendar.title}</td>
                <td className="pl-3 text-sm text-gray-500">{maskCalendarUrl(calendar.url)}</td>
                <td className="w-px whitespace-nowrap">
                  <NavLink
                    className="c-button"
                    to={'/' + ROUTE_PARTS.settings + '/' + ROUTE_PARTS.calendars + '/' + calendar.id + '/' + ROUTE_PARTS.edit}
                    onClick={(e) => e.stopPropagation()}
                  >
                    EDIT
                  </NavLink>
                </td>
                <td className="w-px whitespace-nowrap">
                  <button
                    className="c-button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (calendar.id) {
                        await deleteCalendar({ id: calendar.id });
                        await refetchCalendars();
                        toast('Calendar has been deleted', { type: 'success' });
                      } else {
                        toast("Cannot delete a calendar since it doesn't have an id", {
                          type: 'error',
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

export default CalendarsPage;
