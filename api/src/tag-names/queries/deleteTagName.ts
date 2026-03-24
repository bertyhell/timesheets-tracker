import type { Database } from 'bun:sqlite';

export type DeleteTagNameParams = {
	param1: string;
}

export type DeleteTagNameResult = {
	changes: number;
}

export function deleteTagName(db: Database, params: DeleteTagNameParams): DeleteTagNameResult {
	const sql = `
	DELETE FROM tagNames
	WHERE id = $id
	
	`
	return db.prepare(sql)
		.run(params.param1) as DeleteTagNameResult;
}