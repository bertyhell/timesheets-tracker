import type { DatabaseSync } from 'node:sqlite';

export type UpdateActiveStateData = {
  isActive: number | null;
  startedAt: string;
  endedAt: string;
};

export type UpdateActiveStateParams = {
  id: string;
};

export type UpdateActiveStateResult = {
  changes: number;
};

export function updateActiveState(
  db: DatabaseSync,
  data: UpdateActiveStateData,
  params: UpdateActiveStateParams
): UpdateActiveStateResult {
  const sql = `
	UPDATE activeStates
	SET isActive = ?, startedAt = ?, endedAt = ?
	WHERE id = ?
	`;
  return db
    .prepare(sql)
    .run(data.isActive, data.startedAt, data.endedAt, params.id) as UpdateActiveStateResult;
}
