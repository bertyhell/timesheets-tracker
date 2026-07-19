import type { DatabaseSync } from 'node:sqlite';

export function upsertSetting(db: DatabaseSync, params: { key: string; value: string | null }): void {
  const sql = `
    INSERT INTO settings (key, value, createdAt, updatedAt)
    VALUES (?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updatedAt = datetime('now')
  `;
  db.prepare(sql).run(params.key, params.value);
}
