import type { Database } from 'bun:sqlite';

export type DeleteAutoTagParams = {
	id: string;
}

export type DeleteAutoTagResult = {
	changes: number;
}

export function deleteAutoTag(db: Database, params: DeleteAutoTagParams): DeleteAutoTagResult {
	const sql = `
	DELETE FROM autoTags
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteAutoTagResult;
}