import type { Database } from 'bun:sqlite';

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

export function findAllAutoNotesBySearchTerm(db: Database, params: FindAllAutoNotesBySearchTermParams): FindAllAutoNotesBySearchTermResult[] {
	const sql = `
	SELECT id, title, tagNameId, variable, extractRegex, extractRegexReplacement
	FROM autoNotes
	WHERE title like '%' || ? || '%'
	`
	return db.prepare(sql)
		.values(params.searchTerm)
		.map(data => mapArrayToFindAllAutoNotesBySearchTermResult(data));
}

function mapArrayToFindAllAutoNotesBySearchTermResult(data: any) {
	const result: FindAllAutoNotesBySearchTermResult = {
		id: data[0],
		title: data[1],
		tagNameId: data[2],
		variable: data[3],
		extractRegex: data[4],
		extractRegexReplacement: data[5]
	}
	return result;
}