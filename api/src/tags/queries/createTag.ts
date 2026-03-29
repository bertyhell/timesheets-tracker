import type { Database } from 'bun:sqlite';

export type CreateTagParams = {
  id: string;
  tagNameId: string;
  startedAt: string;
  endedAt: string;
};

export type CreateTagResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createTag(db: Database, params: CreateTagParams): CreateTagResult {
  const sql = `
	INSERT INTO tags
	(id, tagNameId, startedAt, endedAt)
	VALUES (?, ?, ?, ?)
	
	`;
  return db
    .prepare(sql)
    .run(params.id, params.tagNameId, params.startedAt, params.endedAt) as CreateTagResult;
}
