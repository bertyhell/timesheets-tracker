import { client } from '../generated/api/client.gen';

export const reorderTimelines = (items: { id: string; visualOrder: number }[]) =>
  client.patch({
    url: '/api/timelines/reorder',
    body: items,
    headers: { 'Content-Type': 'application/json' },
  });

export const reorderAutoTags = (items: { id: string; priority: number }[]) =>
  client.patch({
    url: '/api/auto-tags/reorder',
    body: items,
    headers: { 'Content-Type': 'application/json' },
  });
