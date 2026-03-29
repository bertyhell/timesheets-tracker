import type { Database } from 'bun:sqlite';

export type CreateAutoTagParams = {
	id: string;
	title: string;
	tagNameId: string;
	priority: number;
	conditions: string;
}

export type CreateAutoTagResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createAutoTag(db: Database, params: CreateAutoTagParams): CreateAutoTagResult {
	const sql = `
	INSERT INTO autoTags
	(
	    id,
	    title,
	    tagNameId,
	    priority,
	    conditions
	)
	VALUES (?, ?, ?, ?, ?)
	`
	return db.prepare(sql)
		.run(params.id, params.title, params.tagNameId, params.priority, params.conditions) as CreateAutoTagResult;
}