import type { Database } from 'bun:sqlite';

export type UpdateProgramData = {
	programName: string | null;
	windowTitle: string | null;
	startedAt: string;
	endedAt: string;
}

export type UpdateProgramParams = {
	id: string;
}

export type UpdateProgramResult = {
	changes: number;
}

export function updateProgram(db: Database, data: UpdateProgramData, params: UpdateProgramParams): UpdateProgramResult {
	const sql = `
	UPDATE programs
	SET
	    programName = ?,
	    windowTitle = ?,
	    startedAt = ?,
	    endedAt = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.programName, data.windowTitle, data.startedAt, data.endedAt, params.id) as UpdateProgramResult;
}