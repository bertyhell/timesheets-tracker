import type { Database } from 'bun:sqlite';

export type CountTimelinesResult = {
	count: number;
}

export function countTimelines(db: Database): CountTimelinesResult | null {
	const sql = `
	SELECT count(*) as count
	FROM timelines
	`
	const res = db.prepare(sql)
		.values();

	return res.length > 0 ? mapArrayToCountTimelinesResult(res[0]) : null;
}

function mapArrayToCountTimelinesResult(data: any) {
	const result: CountTimelinesResult = {
		count: data[0]
	}
	return result;
}