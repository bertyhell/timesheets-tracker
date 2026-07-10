import type { DatabaseSync } from 'node:sqlite';

export type ReorderAutoTagItem = {
  id: string;
  priority: number;
};

export function reorderAutoTags(db: DatabaseSync, items: ReorderAutoTagItem[]): void {
  const stmt = db.prepare('UPDATE autoTags SET priority = ? WHERE id = ?');
  for (const item of items) {
    stmt.run(item.priority, item.id);
  }
}
