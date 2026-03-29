import type { Database } from 'bun:sqlite';

export type DeleteAutoNoteParams = {
  id: string;
};

export type DeleteAutoNoteResult = {
  changes: number;
};

export function deleteAutoNote(db: Database, params: DeleteAutoNoteParams): DeleteAutoNoteResult {
  const sql = `
	DELETE FROM autoNotes
	WHERE id = ?
	
	`;
  return db.prepare(sql).run(params.id) as DeleteAutoNoteResult;
}
