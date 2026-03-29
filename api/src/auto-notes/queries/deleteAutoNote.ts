import type { Database } from 'bun:sqlite';

export type DeleteAutoNoteParams = {
  param1: string;
};

export type DeleteAutoNoteResult = {
  changes: number;
};

export function deleteAutoNote(db: Database, params: DeleteAutoNoteParams): DeleteAutoNoteResult {
  const sql = `
	DELETE FROM autoNotes
	WHERE id = $id
	
	`;
  return db.prepare(sql).run(params.param1) as DeleteAutoNoteResult;
}
