import type { DatabaseSync } from 'node:sqlite';

export type ReorderTimelineItem = {
  id: string;
  visualOrder: number;
};

export function reorderTimelines(db: DatabaseSync, items: ReorderTimelineItem[]): void {
  const stmt = db.prepare('UPDATE timelines SET visualOrder = ? WHERE id = ?');
  for (const item of items) {
    stmt.run(item.visualOrder, item.id);
  }
}
