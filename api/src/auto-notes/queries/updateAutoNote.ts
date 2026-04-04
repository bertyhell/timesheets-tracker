import type { Database } from 'bun:sqlite';

export type UpdateAutoNoteData = {
	title: string;
	tagNameId: string | null;
	variable: string;
	extractRegex: string | null;
	extractRegexReplacement: string | null;
}

export type UpdateAutoNoteParams = {
	id: string;
}

export type UpdateAutoNoteResult = {
	changes: number;
}

export function updateAutoNote(db: Database, data: UpdateAutoNoteData, params: UpdateAutoNoteParams): UpdateAutoNoteResult {
	const sql = `
	UPDATE autoNotes
	SET
	    title = ?,
	    tagNameId = ?,
	    variable = ?,
	    extractRegex = ?,
	    extractRegexReplacement = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.title, data.tagNameId, data.variable, data.extractRegex, data.extractRegexReplacement, params.id) as UpdateAutoNoteResult;
}