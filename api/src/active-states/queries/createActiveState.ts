import type { DatabaseSync } from 'node:sqlite';

export type CreateActiveStateParams = {
  id: string;
  isActive: number | null;
  startedAt: string;
  endedAt: string;
};

export type CreateActiveStateResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createActiveState(
  db: DatabaseSync,
  params: CreateActiveStateParams
): CreateActiveStateResult {
  const sql = `
	INSERT INTO activeStates
	(id, isActive, startedAt, endedAt)
	VALUES (?, ?, ?, ?)
	`;
  return db
    .prepare(sql)
    .run(params.id, params.isActive, params.startedAt, params.endedAt) as CreateActiveStateResult;
}
