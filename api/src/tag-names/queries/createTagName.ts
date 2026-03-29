import type { Database } from 'bun:sqlite';

export type CreateTagNameParams = {
  param1: string;
  param2: string;
  param3: string | null;
  param4: string;
};

export type CreateTagNameResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createTagName(db: Database, params: CreateTagNameParams): CreateTagNameResult {
  const sql = `
	INSERT INTO tagNames
	(id, title, code, color)
	VALUES ($id, $title, $code, $color)
	
	
	
	`;
  return db
    .prepare(sql)
    .run(params.param1, params.param2, params.param3, params.param4) as CreateTagNameResult;
}
