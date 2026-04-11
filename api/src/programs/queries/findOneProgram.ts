import type { Database } from 'bun:sqlite';

export type FindOneProgramParams = {
	id: string;
}

export type FindOneProgramResult = {
	id: string;
	programName?: string;
	windowTitle?: string;
	startedAt: string;
	endedAt: string;
}

export function findOneProgram(db: Database, params: FindOneProgramParams): FindOneProgramResult | null {
	const sql = `
	SELECT id, programName, windowTitle, startedAt, endedAt
	FROM programs
	WHERE id = ?
	LIMIT 1
	`
	const res = db.prepare(sql)
		.values(params.id);

	return res.length > 0 ? mapArrayToFindOneProgramResult(res[0]) : null;
}

function mapArrayToFindOneProgramResult(data: any) {
	const result: FindOneProgramResult = {
		id: data[0],
		programName: data[1],
		windowTitle: data[2],
		startedAt: data[3],
		endedAt: data[4]
	}
	return result;
}