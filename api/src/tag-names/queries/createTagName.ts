import type { Database } from 'bun:sqlite';

export type CreateTagNameParams = {
	id: string;
	title: string;
	code: string | null;
	color: string;
}

export type CreateTagNameResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createTagName(db: Database, params: CreateTagNameParams): CreateTagNameResult {
	const sql = `
	INSERT INTO tagNames
	(id, title, code, color)
	VALUES (?, ?, ?, ?)
	`
	return db.prepare(sql)
		.run(params.id, params.title, params.code, params.color) as CreateTagNameResult;
}