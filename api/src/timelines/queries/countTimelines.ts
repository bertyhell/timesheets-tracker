import type { DatabaseSync } from 'node:sqlite';

export type CountTimelinesResult = {
  count: number;
};

export function countTimelines(db: DatabaseSync): CountTimelinesResult | null {
  const sql = `
	SELECT count(*) as count
	FROM timelines
	`;
  return (db.prepare(sql).get() as CountTimelinesResult | null) ?? null;
}
