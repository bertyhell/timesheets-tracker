import type { DatabaseSync } from 'node:sqlite';

export type UpdateTagNoteData = {
  note: string | null;
};

export type UpdateTagNoteParams = {
  id: string;
};

export type UpdateTagNoteResult = {
  changes: number;
};

export function updateTagNote(
  db: DatabaseSync,
  data: UpdateTagNoteData,
  params: UpdateTagNoteParams
): UpdateTagNoteResult {
  const sql = `
	UPDATE tags
	SET
	    note = ?
	WHERE id = ?
	`;
  return db.prepare(sql).run(data.note, params.id) as UpdateTagNoteResult;
}
