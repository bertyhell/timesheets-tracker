import type { Database } from 'bun:sqlite';

export type CreateAutoTagParams = {
  param1: string;
  param2: string;
  param3: string;
  param4: number;
  param5: string;
};

export type CreateAutoTagResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createAutoTag(db: Database, params: CreateAutoTagParams): CreateAutoTagResult {
  const sql = `
	INSERT INTO autoTags
	(
	    id,
	    title,
	    tagNameId,
	    priority,
	    conditions
	)
	VALUES ($id, $title, $tagNameId, $priority, $conditions)
	
	`;
  return db
    .prepare(sql)
    .run(
      params.param1,
      params.param2,
      params.param3,
      params.param4,
      params.param5
    ) as CreateAutoTagResult;
}
