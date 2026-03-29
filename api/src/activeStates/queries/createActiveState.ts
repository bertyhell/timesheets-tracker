import type { Database } from 'bun:sqlite';

export type CreateActiveStateParams = {
  param1: string;
  param2: number | null;
  param3: string;
  param4: string;
};

export type CreateActiveStateResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createActiveState(
  db: Database,
  params: CreateActiveStateParams
): CreateActiveStateResult {
  const sql = `
	INSERT INTO activeStates
	(id, isActive, startedAt, endedAt)
	VALUES ($id, $isActive, $startedAt, $endedAt)
	
	`;
  return db
    .prepare(sql)
    .run(params.param1, params.param2, params.param3, params.param4) as CreateActiveStateResult;
}
