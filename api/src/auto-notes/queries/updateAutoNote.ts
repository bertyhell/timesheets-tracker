import type { Database } from 'bun:sqlite';

export type UpdateAutoNoteData = {
	param1: string;
	param2: string | null;
	param3: string;
	param4: string | null;
	param5: string | null;
}

export type UpdateAutoNoteParams = {
	param1: string;
}

export type UpdateAutoNoteResult = {
	changes: number;
}

export function updateAutoNote(db: Database, data: UpdateAutoNoteData, params: UpdateAutoNoteParams): UpdateAutoNoteResult {
	const sql = `
	UPDATE autoNotes
	SET
	    title = $title,
	    tagNameId = $tagNameId,
	    variable = $variable,
	    extractRegex = $extractRegex,
	    extractRegexReplacement = $extractRegexReplacement
	WHERE id = $id
	
	`
	return db.prepare(sql)
		.run(data.param1, data.param2, data.param3, data.param4, data.param5, params.param1) as UpdateAutoNoteResult;
}