import type { DatabaseSync } from 'node:sqlite';

export type UpdateTagTimeData = {
  startedAt: string;
  endedAt: string;
};

export type UpdateTagTimeParams = {
  id: string;
};

export type UpdateTagTimeResult = {
  changes: number;
};

export function updateTagTime(
  db: DatabaseSync,
  data: UpdateTagTimeData,
  params: UpdateTagTimeParams
): UpdateTagTimeResult {
  const sql = `
	UPDATE tags
	SET
	    startedAt = ?,
	    endedAt = ?
	WHERE id = ?
	`;
  return db
    .prepare(sql)
    .run(data.startedAt, data.endedAt, params.id) as UpdateTagTimeResult;
}
