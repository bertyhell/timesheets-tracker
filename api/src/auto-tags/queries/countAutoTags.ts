import type { DatabaseSync } from 'node:sqlite';

export type CountAutoTagsResult = {
	count: number;
}

export function countAutoTags(db: DatabaseSync): CountAutoTagsResult | null {
	const sql = `
	SELECT count(*) as count
	FROM autoTags
	`
	return db.prepare(sql).get() as CountAutoTagsResult | null ?? null;
}
