import type { Database } from 'bun:sqlite';

export type UpdateTagNameData = {
	title: string;
	code: string | null;
	color: string;
}

export type UpdateTagNameParams = {
	id: string;
}

export type UpdateTagNameResult = {
	changes: number;
}

export function updateTagName(db: Database, data: UpdateTagNameData, params: UpdateTagNameParams): UpdateTagNameResult {
	const sql = `
	UPDATE tagNames
	SET
	    title = ?,
	    code = ?,
	    color = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.title, data.code, data.color, params.id) as UpdateTagNameResult;
}