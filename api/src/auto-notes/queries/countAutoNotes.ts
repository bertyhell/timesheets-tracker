import type { DatabaseSync } from 'node:sqlite';

export type CountAutoNotesResult = {
	count: number;
}

export function countAutoNotes(db: DatabaseSync): CountAutoNotesResult | null {
	const sql = `
	SELECT count(*) as count
	FROM autoNotes
	`
	return db.prepare(sql).get() as CountAutoNotesResult | null ?? null;
}
