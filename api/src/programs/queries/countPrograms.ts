import type { Database } from 'bun:sqlite';

export type CountProgramsResult = {
	count: number;
}

export function countPrograms(db: Database): CountProgramsResult | null {
	const sql = `
	SELECT COUNT(*) as count FROM programs
	`
	const res = db.prepare(sql)
		.values();

	return res.length > 0 ? mapArrayToCountProgramsResult(res[0]) : null;
}

function mapArrayToCountProgramsResult(data: any) {
	const result: CountProgramsResult = {
		count: data[0]
	}
	return result;
}