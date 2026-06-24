import type { DatabaseSync } from 'node:sqlite';

export type FindOneAutoNoteParams = {
	id: string;
}

export type FindOneAutoNoteResult = {
	id: string;
	title: string;
	tagNameId?: string;
	variable: string;
	extractRegex?: string;
	extractRegexReplacement?: string;
}

export function findOneAutoNote(db: DatabaseSync, params: FindOneAutoNoteParams): FindOneAutoNoteResult | null {
	const sql = `
	SELECT id, title, tagNameId, variable, extractRegex, extractRegexReplacement
	FROM autoNotes
	WHERE id = ?
	LIMIT 1
	`
	return db.prepare(sql).get(params.id) as FindOneAutoNoteResult | null ?? null;
}
