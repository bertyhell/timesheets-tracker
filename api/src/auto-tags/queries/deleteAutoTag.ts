import type { Database } from 'bun:sqlite';

export type DeleteAutoTagParams = {
  param1: string;
};

export type DeleteAutoTagResult = {
  changes: number;
};

export function deleteAutoTag(db: Database, params: DeleteAutoTagParams): DeleteAutoTagResult {
  const sql = `
	DELETE FROM autoTags
	WHERE id = $id
	
	`;
  return db.prepare(sql).run(params.param1) as DeleteAutoTagResult;
}
