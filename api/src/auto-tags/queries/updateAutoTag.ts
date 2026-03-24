import type { Database } from 'bun:sqlite';

export type UpdateAutoTagData = {
	param1: string;
	param2: string;
	param3: number;
	param4: string;
}

export type UpdateAutoTagParams = {
	param1: string;
}

export type UpdateAutoTagResult = {
	changes: number;
}

export function updateAutoTag(db: Database, data: UpdateAutoTagData, params: UpdateAutoTagParams): UpdateAutoTagResult {
	const sql = `
	UPDATE autoTags
	SET
	    title = $title,
	    tagNameId = $tagNameId,
	    priority = $priority,
	    conditions = $conditions
	WHERE id = $id
	
	`
	return db.prepare(sql)
		.run(data.param1, data.param2, data.param3, data.param4, params.param1) as UpdateAutoTagResult;
}