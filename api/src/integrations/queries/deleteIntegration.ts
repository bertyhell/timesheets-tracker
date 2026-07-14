import type { DatabaseSync } from 'node:sqlite';

export function deleteIntegration(db: DatabaseSync, params: { type: string }): void {
  const sql = `DELETE FROM integrations WHERE type = ?`;
  db.prepare(sql).run(params.type);
}
