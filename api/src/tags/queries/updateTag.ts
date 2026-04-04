import type { Database } from 'bun:sqlite';

export type UpdateTagData = {
	tagNameId: string;
	startedAt: string;
	endedAt: string;
	note: string | null;
}

export type UpdateTagParams = {
	id: string;
}

export type UpdateTagResult = {
	changes: number;
}

export function updateTag(db: Database, data: UpdateTagData, params: UpdateTagParams): UpdateTagResult {
	const sql = `
	UPDATE tags
	SET
	    tagNameId = ?,
	    startedAt = ?,
	    endedAt = ?,
	    note = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.tagNameId, data.startedAt, data.endedAt, data.note, params.id) as UpdateTagResult;
}