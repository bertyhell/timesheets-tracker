import type { Database } from 'bun:sqlite';

export type DeleteActiveStateParams = {
  param1: string;
};

export type DeleteActiveStateResult = {
  changes: number;
};

export function deleteActiveState(
  db: Database,
  params: DeleteActiveStateParams
): DeleteActiveStateResult {
  const sql = `
	DELETE FROM activeStates
	WHERE id = $id
	
	`;
  return db.prepare(sql).run(params.param1) as DeleteActiveStateResult;
}
