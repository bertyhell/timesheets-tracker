import type { Database } from 'bun:sqlite';

export type CountTagNamesResult = {
	count: number;
}

export function countTagNames(db: Database): CountTagNamesResult | null {
	const sql = `
	SELECT count(*) as count
	FROM tagNames
	
	`
	const res = db.prepare(sql)
		.values();

	return res.length > 0 ? mapArrayToCountTagNamesResult(res[0]) : null;
}

function mapArrayToCountTagNamesResult(data: any) {
	const result: CountTagNamesResult = {
		count: data[0]
	}
	return result;
}