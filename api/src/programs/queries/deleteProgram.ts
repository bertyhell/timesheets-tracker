import type { Database } from 'bun:sqlite';

export type DeleteProgramParams = {
	id: string;
}

export type DeleteProgramResult = {
	changes: number;
}

export function deleteProgram(db: Database, params: DeleteProgramParams): DeleteProgramResult {
	const sql = `
	DELETE FROM programs
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteProgramResult;
}