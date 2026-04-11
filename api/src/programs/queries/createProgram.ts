import type { Database } from 'bun:sqlite';

export type CreateProgramParams = {
	id: string;
	programName: string | null;
	windowTitle: string | null;
	startedAt: string;
	endedAt: string;
}

export type CreateProgramResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createProgram(db: Database, params: CreateProgramParams): CreateProgramResult {
	const sql = `
	INSERT INTO programs
	(id, programName, windowTitle, startedAt, endedAt)
	VALUES (?, ?, ?, ?, ?)
	`
	return db.prepare(sql)
		.run(params.id, params.programName, params.windowTitle, params.startedAt, params.endedAt) as CreateProgramResult;
}