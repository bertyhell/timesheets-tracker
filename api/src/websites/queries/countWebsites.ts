import type { DatabaseSync } from 'node:sqlite';

export type CountWebsitesResult = {
  count: number;
};

export function countWebsites(db: DatabaseSync): CountWebsitesResult | null {
  const sql = `
	SELECT count(*) as count
	FROM websites
	`;
  return (db.prepare(sql).get() as CountWebsitesResult | null) ?? null;
}
