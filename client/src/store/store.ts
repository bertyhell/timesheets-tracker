import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithLocation } from 'jotai-location';
import { format, isValid, parseISO } from 'date-fns';
import type { ReactNode } from 'react';

const DATE_PARAM = 'date';

const locationAtom = atomWithLocation({ replace: true });

export const viewDateAtom = atom(
  (get) => {
    const loc = get(locationAtom);
    const raw = loc.searchParams?.get(DATE_PARAM);
    if (raw) {
      const parsed = parseISO(raw);
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  },
  (get, set, update: Date | ((prev: Date) => Date)) => {
    const current = get(viewDateAtom);
    const newDate = typeof update === 'function' ? update(current) : update;
    const loc = get(locationAtom);
    const params = new URLSearchParams(loc.searchParams?.toString() ?? '');
    params.set(DATE_PARAM, format(newDate, 'yyyy-MM-dd'));
    set(locationAtom, { ...loc, searchParams: params });
  }
);

export const searchTermAtom = atom('');
export const headerActionsAtom = atom<ReactNode>(null);
export const sidebarCollapsedAtom = atomWithStorage('timesheetTracker.sidebarToggle', false);
