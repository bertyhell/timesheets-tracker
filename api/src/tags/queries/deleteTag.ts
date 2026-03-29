import type { Database } from 'bun:sqlite';

export type DeleteTagParams = {
	id: string;
}

export type DeleteTagResult = {
	changes: number;
}

export function deleteTag(db: Database, params: DeleteTagParams): DeleteTagResult {
	const sql = `
	DELETE FROM tags
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteTagResult;
}