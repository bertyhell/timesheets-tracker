import type { DatabaseSync } from 'node:sqlite';

export function deleteOldPrograms(db: DatabaseSync, params: { before: string }): { changes: number } {
  const sql = `DELETE FROM programs WHERE startedAt < ?`;
  return db.prepare(sql).run(params.before) as { changes: number };
}
