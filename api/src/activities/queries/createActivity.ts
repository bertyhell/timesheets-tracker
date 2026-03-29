import type { Database } from 'bun:sqlite';

export type CreateActivityParams = {
  param1: string;
  param2: string | null;
  param3: string | null;
  param4: string;
  param5: string;
};

export type CreateActivityResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createActivity(db: Database, params: CreateActivityParams): CreateActivityResult {
  const sql = `
	INSERT INTO activities
	(id, programName, windowTitle, startedAt, endedAt)
	VALUES ($id, $programName, $windowTitle, $startedAt, $endedAt)
	
	`;
  return db
    .prepare(sql)
    .run(
      params.param1,
      params.param2,
      params.param3,
      params.param4,
      params.param5
    ) as CreateActivityResult;
}
