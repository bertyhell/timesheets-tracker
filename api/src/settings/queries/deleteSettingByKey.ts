import type { DatabaseSync } from 'node:sqlite';

export function deleteSettingByKey(db: DatabaseSync, params: { key: string }): void {
  const sql = `DELETE FROM settings WHERE key = ?`;
  db.prepare(sql).run(params.key);
}
