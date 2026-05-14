import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { ReactNode } from 'react';

export const viewDateAtom = atom(new Date());
export const searchTermAtom = atom('');
export const headerActionsAtom = atom<ReactNode>(null);
export const sidebarCollapsedAtom = atomWithStorage('timesheetTracker.sidebarToggle', false);
