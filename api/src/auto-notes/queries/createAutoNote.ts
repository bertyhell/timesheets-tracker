import type { DatabaseSync } from 'node:sqlite';

export type CreateAutoNoteParams = {
	id: string;
	title: string;
	tagNameId: string | null;
	variable: string;
	extractRegex: string | null;
	extractRegexReplacement: string | null;
}

export type CreateAutoNoteResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createAutoNote(db: DatabaseSync, params: CreateAutoNoteParams): CreateAutoNoteResult {
	const sql = `
	INSERT INTO autoNotes
	(id, title, tagNameId, variable, extractRegex, extractRegexReplacement)
	VALUES (?, ?, ?, ?, ?, ?)
	`
	return db.prepare(sql)
		.run(params.id, params.title, params.tagNameId, params.variable, params.extractRegex, params.extractRegexReplacement) as CreateAutoNoteResult;
}