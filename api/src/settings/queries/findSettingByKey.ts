import type { DatabaseSync } from 'node:sqlite';

export type FindSettingByKeyResult = {
  key: string;
  value: string | null;
  createdAt: string;
  updatedAt: string;
};

export function findSettingByKey(
  db: DatabaseSync,
  params: { key: string }
): FindSettingByKeyResult | undefined {
  const sql = `SELECT key, value, createdAt, updatedAt FROM settings WHERE key = ?`;
  return db.prepare(sql).get(params.key) as FindSettingByKeyResult | undefined;
}
