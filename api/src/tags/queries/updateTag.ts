import type { Database } from 'bun:sqlite';

export type UpdateTagData = {
  param1: string;
  param2: string;
  param3: string;
  param4: string | null;
};

export type UpdateTagParams = {
  param1: string;
};

export type UpdateTagResult = {
  changes: number;
};

export function updateTag(
  db: Database,
  data: UpdateTagData,
  params: UpdateTagParams
): UpdateTagResult {
  const sql = `
	UPDATE tags
	SET
	    tagNameId = $tagNameId,
	    startedAt = $startedAt,
	    endedAt = $endedAt,
	    note = $note
	WHERE id = $id
	
	`;
  return db
    .prepare(sql)
    .run(data.param1, data.param2, data.param3, data.param4, params.param1) as UpdateTagResult;
}
