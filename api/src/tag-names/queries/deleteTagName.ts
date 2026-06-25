import type { DatabaseSync } from 'node:sqlite';

export type DeleteTagNameParams = {
  id: string;
};

export type DeleteTagNameResult = {
  changes: number;
};

export function deleteTagName(db: DatabaseSync, params: DeleteTagNameParams): DeleteTagNameResult {
  const sql = `
	DELETE FROM tagNames
	WHERE id = ?
	`;
  return db.prepare(sql).run(params.id) as DeleteTagNameResult;
}
