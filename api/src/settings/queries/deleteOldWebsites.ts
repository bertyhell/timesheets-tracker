import type { DatabaseSync } from 'node:sqlite';

export function deleteOldWebsites(db: DatabaseSync, params: { before: string }): { changes: number } {
  const sql = `DELETE FROM websites WHERE startedAt < ?`;
  return db.prepare(sql).run(params.before) as { changes: number };
}
