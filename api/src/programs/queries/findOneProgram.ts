import type { DatabaseSync } from 'node:sqlite';

export type FindOneProgramParams = {
	id: string;
}

export type FindOneProgramResult = {
	id: string;
	programName?: string;
	windowTitle?: string;
	startedAt: string;
	endedAt: string;
}

export function findOneProgram(db: DatabaseSync, params: FindOneProgramParams): FindOneProgramResult | null {
	const sql = `
	SELECT id, programName, windowTitle, startedAt, endedAt
	FROM programs
	WHERE id = ?
	LIMIT 1
	`
	return db.prepare(sql).get(params.id) as FindOneProgramResult | null ?? null;
}
