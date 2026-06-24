import type { DatabaseSync } from 'node:sqlite';

export type DeleteAutoTagParams = {
	id: string;
}

export type DeleteAutoTagResult = {
	changes: number;
}

export function deleteAutoTag(db: DatabaseSync, params: DeleteAutoTagParams): DeleteAutoTagResult {
	const sql = `
	DELETE FROM autoTags
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteAutoTagResult;
}