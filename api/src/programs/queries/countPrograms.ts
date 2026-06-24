import type { DatabaseSync } from 'node:sqlite';

export type CountProgramsResult = {
	count: number;
}

export function countPrograms(db: DatabaseSync): CountProgramsResult | null {
	const sql = `
	SELECT COUNT(*) as count FROM programs
	`
	return db.prepare(sql).get() as CountProgramsResult | null ?? null;
}
