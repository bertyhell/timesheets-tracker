import type { Database } from 'bun:sqlite';

export type UpdateTagNameData = {
  param1: string;
  param2: string | null;
  param3: string;
};

export type UpdateTagNameParams = {
  param1: string;
};

export type UpdateTagNameResult = {
  changes: number;
};

export function updateTagName(
  db: Database,
  data: UpdateTagNameData,
  params: UpdateTagNameParams
): UpdateTagNameResult {
  const sql = `
	UPDATE tagNames
	SET
	    title = $title,
	    code = $code,
	    color = $color
	WHERE id = $id
	
	`;
  return db
    .prepare(sql)
    .run(data.param1, data.param2, data.param3, params.param1) as UpdateTagNameResult;
}
