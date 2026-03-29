import type { Database } from 'bun:sqlite';

export type DeleteTagParams = {
  param1: string;
};

export type DeleteTagResult = {
  changes: number;
};

export function deleteTag(db: Database, params: DeleteTagParams): DeleteTagResult {
  const sql = `
	DELETE FROM tags
	WHERE id = $id
	
	`;
  return db.prepare(sql).run(params.param1) as DeleteTagResult;
}
