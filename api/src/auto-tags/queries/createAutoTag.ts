import type { DatabaseSync } from 'node:sqlite';

export type CreateAutoTagParams = {
  id: string;
  title: string;
  tagNameId: string;
  priority: number;
  conditions: string;
  activeFrom: string | null;
  activeUntil: string | null;
};

export type CreateAutoTagResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createAutoTag(db: DatabaseSync, params: CreateAutoTagParams): CreateAutoTagResult {
  const sql = `
	INSERT INTO autoTags
	(
	    id,
	    title,
	    tagNameId,
	    priority,
	    conditions,
	    activeFrom,
	    activeUntil
	)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`;
  return db
    .prepare(sql)
    .run(
      params.id,
      params.title,
      params.tagNameId ?? null,
      params.priority,
      params.conditions,
      params.activeFrom ?? null,
      params.activeUntil ?? null
    ) as CreateAutoTagResult;
}
