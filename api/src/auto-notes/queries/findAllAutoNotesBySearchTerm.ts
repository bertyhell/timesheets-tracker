import type { DatabaseSync } from 'node:sqlite';

export type FindAllAutoNotesBySearchTermParams = {
	searchTerm: string;
}

export type FindAllAutoNotesBySearchTermResult = {
	id: string;
	title: string;
	tagNameId?: string;
	variable: string;
	extractRegex?: string;
	extractRegexReplacement?: string;
}

export function findAllAutoNotesBySearchTerm(db: DatabaseSync, params: FindAllAutoNotesBySearchTermParams): FindAllAutoNotesBySearchTermResult[] {
	const sql = `
	SELECT id, title, tagNameId, variable, extractRegex, extractRegexReplacement
	FROM autoNotes
	WHERE title like '%' || ? || '%'
	`
	return db.prepare(sql)
		.all(params.searchTerm)
		.map(data => mapArrayToFindAllAutoNotesBySearchTermResult(data));
}

function mapArrayToFindAllAutoNotesBySearchTermResult(data: any) {
	const result: FindAllAutoNotesBySearchTermResult = {
		id: data.id,
		title: data.title,
		tagNameId: data.tagNameId,
		variable: data.variable,
		extractRegex: data.extractRegex,
		extractRegexReplacement: data.extractRegexReplacement
	}
	return result;
}