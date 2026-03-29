import type { Database } from 'bun:sqlite';

export type CreateTagParams = {
  param1: string;
  param2: string;
  param3: string;
  param4: string;
};

export type CreateTagResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createTag(db: Database, params: CreateTagParams): CreateTagResult {
  const sql = `
	INSERT INTO tags
	(id, tagNameId, startedAt, endedAt)
	VALUES ($id, $tagNameId, $startedAt, $endedAt)
	
	`;
  return db
    .prepare(sql)
    .run(params.param1, params.param2, params.param3, params.param4) as CreateTagResult;
}
