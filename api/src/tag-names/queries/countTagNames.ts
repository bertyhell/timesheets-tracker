import type { DatabaseSync } from 'node:sqlite';

export type CountTagNamesResult = {
	count: number;
}

export function countTagNames(db: DatabaseSync): CountTagNamesResult | null {
	const sql = `
	SELECT count(*) as count
	FROM tagNames
	`
	return db.prepare(sql).get() as CountTagNamesResult | null ?? null;
}
