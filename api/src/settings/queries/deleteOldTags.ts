import type { DatabaseSync } from 'node:sqlite';

export function deleteOldTags(db: DatabaseSync, params: { before: string }): { changes: number } {
  const sql = `DELETE FROM tags WHERE startedAt < ?`;
  return db.prepare(sql).run(params.before) as { changes: number };
}
