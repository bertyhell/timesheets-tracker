import type { Database } from 'bun:sqlite';

export type DeleteActivityParams = {
  id: string;
};

export type DeleteActivityResult = {
  changes: number;
};

export function deleteActivity(db: Database, params: DeleteActivityParams): DeleteActivityResult {
  const sql = `
	DELETE FROM activities
	WHERE id = ?
	
	`;
  return db.prepare(sql).run(params.id) as DeleteActivityResult;
}
