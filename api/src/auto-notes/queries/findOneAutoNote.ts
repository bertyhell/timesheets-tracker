import type { Database } from 'bun:sqlite';

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

export function findOneAutoNote(db: Database, params: FindOneAutoNoteParams): FindOneAutoNoteResult | null {
	const sql = `
	SELECT id, title, tagNameId, variable, extractRegex, extractRegexReplacement
	FROM autoNotes
	WHERE id = ?
	LIMIT 1
	`
	const res = db.prepare(sql)
		.values(params.id);

	return res.length > 0 ? mapArrayToFindOneAutoNoteResult(res[0]) : null;
}

function mapArrayToFindOneAutoNoteResult(data: any) {
	const result: FindOneAutoNoteResult = {
		id: data[0],
		title: data[1],
		tagNameId: data[2],
		variable: data[3],
		extractRegex: data[4],
		extractRegexReplacement: data[5]
	}
	return result;
}