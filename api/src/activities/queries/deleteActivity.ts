import type { Database } from 'bun:sqlite';

export type DeleteActivityParams = {
  param1: string;
};

export type DeleteActivityResult = {
  changes: number;
};

export function deleteActivity(db: Database, params: DeleteActivityParams): DeleteActivityResult {
  const sql = `
	DELETE FROM activities
	WHERE id = $id
	
	`;
  return db.prepare(sql).run(params.param1) as DeleteActivityResult;
}
