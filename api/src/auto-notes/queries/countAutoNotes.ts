import type { Database } from 'bun:sqlite';

export type CountAutoNotesResult = {
	count: number;
}

export function countAutoNotes(db: Database): CountAutoNotesResult | null {
	const sql = `
	SELECT count(*) as count
	FROM autoNotes
	
	`
	const res = db.prepare(sql)
		.values();

	return res.length > 0 ? mapArrayToCountAutoNotesResult(res[0]) : null;
}

function mapArrayToCountAutoNotesResult(data: any) {
	const result: CountAutoNotesResult = {
		count: data[0]
	}
	return result;
}