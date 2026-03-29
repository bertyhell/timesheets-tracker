import type { Database } from 'bun:sqlite';

export type DeleteActiveStateParams = {
	id: string;
}

export type DeleteActiveStateResult = {
	changes: number;
}

export function deleteActiveState(db: Database, params: DeleteActiveStateParams): DeleteActiveStateResult {
	const sql = `
	DELETE FROM activeStates
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteActiveStateResult;
}