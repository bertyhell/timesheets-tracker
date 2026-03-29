import type { Database } from 'bun:sqlite';

export type FindAllAutoNotesResult = {
	id: string;
	title: string;
	tagNameId?: string;
	variable: string;
	extractRegex?: string;
	extractRegexReplacement?: string;
}

export function findAllAutoNotes(db: Database): FindAllAutoNotesResult[] {
	const sql = `
	SELECT id, title, tagNameId, variable, extractRegex, extractRegexReplacement
	FROM autoNotes
	`
	return db.prepare(sql)
		.values()
		.map(data => mapArrayToFindAllAutoNotesResult(data));
}

function mapArrayToFindAllAutoNotesResult(data: any) {
	const result: FindAllAutoNotesResult = {
		id: data[0],
		title: data[1],
		tagNameId: data[2],
		variable: data[3],
		extractRegex: data[4],
		extractRegexReplacement: data[5]
	}
	return result;
}