import type { DatabaseSync } from 'node:sqlite';

export type CreateTagParams = {
  id: string;
  tagNameId: string;
  startedAt: string;
  endedAt: string;
  note?: string | null;
};

export type CreateTagResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createTag(db: DatabaseSync, params: CreateTagParams): CreateTagResult {
  const sql = `
	INSERT INTO tags
	(id, tagNameId, startedAt, endedAt, note)
	VALUES (?, ?, ?, ?, ?)
	`;
  return db
    .prepare(sql)
    .run(params.id, params.tagNameId, params.startedAt, params.endedAt, params.note ?? null) as CreateTagResult;
}
