import type { DatabaseSync } from 'node:sqlite';

export type FindAllAutoNotesResult = {
  id: string;
  title: string;
  tagNameId?: string;
  variable: string;
  extractRegex?: string;
  extractRegexReplacement?: string;
};

export function findAllAutoNotes(db: DatabaseSync): FindAllAutoNotesResult[] {
  const sql = `
	SELECT id, title, tagNameId, variable, extractRegex, extractRegexReplacement
	FROM autoNotes
	`;
  return db
    .prepare(sql)
    .all()
    .map((data) => mapArrayToFindAllAutoNotesResult(data));
}

function mapArrayToFindAllAutoNotesResult(data: any) {
  const result: FindAllAutoNotesResult = {
    id: data.id,
    title: data.title,
    tagNameId: data.tagNameId,
    variable: data.variable,
    extractRegex: data.extractRegex,
    extractRegexReplacement: data.extractRegexReplacement,
  };
  return result;
}
