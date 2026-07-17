import type { DatabaseSync } from 'node:sqlite';

export type CreateTagNameParams = {
  id: string;
  title: string;
  code: string | null;
  color: string;
  note: string | null;
};

export type CreateTagNameResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createTagName(db: DatabaseSync, params: CreateTagNameParams): CreateTagNameResult {
  const sql = `
	INSERT INTO tagNames
	(id, title, code, color, note)
	VALUES (?, ?, ?, ?, ?)
	`;
  return db
    .prepare(sql)
    .run(params.id, params.title, params.code, params.color, params.note) as CreateTagNameResult;
}
