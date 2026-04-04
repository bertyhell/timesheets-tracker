import type { Database } from 'bun:sqlite';

export type CountAutoTagsResult = {
	count: number;
}

export function countAutoTags(db: Database): CountAutoTagsResult | null {
	const sql = `
	SELECT count(*) as count
	FROM autoTags
	`
	const res = db.prepare(sql)
		.values();

	return res.length > 0 ? mapArrayToCountAutoTagsResult(res[0]) : null;
}

function mapArrayToCountAutoTagsResult(data: any) {
	const result: CountAutoTagsResult = {
		count: data[0]
	}
	return result;
}