import type { Database } from 'bun:sqlite';

export type CreateActivityParams = {
	id: string;
	programName: string | null;
	windowTitle: string | null;
	startedAt: string;
	endedAt: string;
}

export type CreateActivityResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createActivity(db: Database, params: CreateActivityParams): CreateActivityResult {
	const sql = `
	INSERT INTO activities
	(id, programName, windowTitle, startedAt, endedAt)
	VALUES (?, ?, ?, ?, ?)
	`
	return db.prepare(sql)
		.run(params.id, params.programName, params.windowTitle, params.startedAt, params.endedAt) as CreateActivityResult;
}