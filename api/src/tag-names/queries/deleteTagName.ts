import type { Database } from 'bun:sqlite';

export type DeleteTagNameParams = {
	id: string;
}

export type DeleteTagNameResult = {
	changes: number;
}

export function deleteTagName(db: Database, params: DeleteTagNameParams): DeleteTagNameResult {
	const sql = `
	DELETE FROM tagNames
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteTagNameResult;
}