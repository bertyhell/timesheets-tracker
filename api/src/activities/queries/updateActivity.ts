import type { Database } from 'bun:sqlite';

export type UpdateActivityData = {
  param1: string | null;
  param2: string | null;
  param3: string;
  param4: string;
};

export type UpdateActivityParams = {
  param1: string;
};

export type UpdateActivityResult = {
  changes: number;
};

export function updateActivity(
  db: Database,
  data: UpdateActivityData,
  params: UpdateActivityParams
): UpdateActivityResult {
  const sql = `
	UPDATE activities
	SET
	    programName = $programName,
	    windowTitle = $windowTitle,
	    startedAt = $startedAt,
	    endedAt = $endedAt
	WHERE id = $id
	
	`;
  return db
    .prepare(sql)
    .run(data.param1, data.param2, data.param3, data.param4, params.param1) as UpdateActivityResult;
}
