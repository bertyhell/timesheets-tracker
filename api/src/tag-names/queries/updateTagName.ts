import type { DatabaseSync } from 'node:sqlite';

export type UpdateTagNameData = {
  title: string;
  code: string | null;
  color: string;
  note: string | null;
  canGrow: number;
};

export type UpdateTagNameParams = {
  id: string;
};

export type UpdateTagNameResult = {
  changes: number;
};

export function updateTagName(
  db: DatabaseSync,
  data: UpdateTagNameData,
  params: UpdateTagNameParams
): UpdateTagNameResult {
  const sql = `
	UPDATE tagNames
	SET
	    title = ?,
	    code = ?,
	    color = ?,
	    note = ?,
	    canGrow = ?
	WHERE id = ?
	`;
  return db
    .prepare(sql)
    .run(
      data.title,
      data.code,
      data.color,
      data.note,
      data.canGrow,
      params.id
    ) as UpdateTagNameResult;
}
