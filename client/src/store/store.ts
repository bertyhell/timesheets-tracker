import { atom } from 'jotai';
import type { ReactNode } from 'react';

export const viewDateAtom = atom(new Date());
export const searchTermAtom = atom('');
export const headerActionsAtom = atom<ReactNode>(null);
