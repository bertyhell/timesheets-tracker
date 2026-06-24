import type { DatabaseSync } from 'node:sqlite';

export type DeleteActiveStateParams = {
	id: string;
}

export type DeleteActiveStateResult = {
	changes: number;
}

export function deleteActiveState(db: DatabaseSync, params: DeleteActiveStateParams): DeleteActiveStateResult {
	const sql = `
	DELETE FROM activeStates
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteActiveStateResult;
}