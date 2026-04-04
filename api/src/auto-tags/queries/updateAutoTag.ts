import type { Database } from 'bun:sqlite';

export type UpdateAutoTagData = {
	title: string;
	tagNameId: string;
	priority: number;
	conditions: string;
}

export type UpdateAutoTagParams = {
	id: string;
}

export type UpdateAutoTagResult = {
	changes: number;
}

export function updateAutoTag(db: Database, data: UpdateAutoTagData, params: UpdateAutoTagParams): UpdateAutoTagResult {
	const sql = `
	UPDATE autoTags
	SET
	    title = ?,
	    tagNameId = ?,
	    priority = ?,
	    conditions = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.title, data.tagNameId, data.priority, data.conditions, params.id) as UpdateAutoTagResult;
}