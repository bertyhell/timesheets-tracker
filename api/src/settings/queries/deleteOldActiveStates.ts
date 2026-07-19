import type { DatabaseSync } from 'node:sqlite';

export function deleteOldActiveStates(db: DatabaseSync, params: { before: string }): { changes: number } {
  const sql = `DELETE FROM activeStates WHERE startedAt < ?`;
  return db.prepare(sql).run(params.before) as { changes: number };
}
