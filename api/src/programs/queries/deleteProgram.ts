import type { DatabaseSync } from 'node:sqlite';

export type DeleteProgramParams = {
	id: string;
}

export type DeleteProgramResult = {
	changes: number;
}

export function deleteProgram(db: DatabaseSync, params: DeleteProgramParams): DeleteProgramResult {
	const sql = `
	DELETE FROM programs
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteProgramResult;
}