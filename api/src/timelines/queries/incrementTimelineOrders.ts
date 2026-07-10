import type { DatabaseSync } from 'node:sqlite';

export function incrementTimelineOrders(db: DatabaseSync, fromOrder: number): void {
  db.prepare('UPDATE timelines SET visualOrder = visualOrder + 1 WHERE visualOrder >= ?').run(
    fromOrder
  );
}
