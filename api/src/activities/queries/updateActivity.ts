import type { Database } from 'bun:sqlite';

export type UpdateActivityData = {
	programName: string | null;
	windowTitle: string | null;
	startedAt: string;
	endedAt: string;
}

export type UpdateActivityParams = {
	id: string;
}

export type UpdateActivityResult = {
	changes: number;
}

export function updateActivity(db: Database, data: UpdateActivityData, params: UpdateActivityParams): UpdateActivityResult {
	const sql = `
	UPDATE activities
	SET
	    programName = ?,
	    windowTitle = ?,
	    startedAt = ?,
	    endedAt = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.programName, data.windowTitle, data.startedAt, data.endedAt, params.id) as UpdateActivityResult;
}