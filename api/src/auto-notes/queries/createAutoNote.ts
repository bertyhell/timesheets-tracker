import type { Database } from 'bun:sqlite';

export type CreateAutoNoteParams = {
  param1: string;
  param2: string;
  param3: string | null;
  param4: string;
  param5: string | null;
  param6: string | null;
};

export type CreateAutoNoteResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createAutoNote(db: Database, params: CreateAutoNoteParams): CreateAutoNoteResult {
  const sql = `
	INSERT INTO autoNotes
	(id, title, tagNameId, variable, extractRegex, extractRegexReplacement)
	VALUES ($id, $title, $tagNameId, $variable, $extractRegex, $extractRegexReplacement)
	
	`;
  return db
    .prepare(sql)
    .run(
      params.param1,
      params.param2,
      params.param3,
      params.param4,
      params.param5,
      params.param6
    ) as CreateAutoNoteResult;
}
