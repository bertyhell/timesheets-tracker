import type { DatabaseSync } from 'node:sqlite';

export type FindAllProgramsParams = {
	startedAt: string;
	endedAt: string;
}

export type FindAllProgramsResult = {
	id: string;
	programName?: string;
	windowTitle?: string;
	startedAt: string;
	endedAt: string;
}

export function findAllPrograms(db: DatabaseSync, params: FindAllProgramsParams): FindAllProgramsResult[] {
	const sql = `
	SELECT id, programName, windowTitle, startedAt, endedAt
	FROM (
	    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY (julianday(endedAt) - julianday(startedAt)) DESC) as rn
	    FROM programs
	    WHERE startedAt > ? AND endedAt < ?
	)
	WHERE rn = 1
	`
	return db.prepare(sql)
		.all(params.startedAt, params.endedAt)
		.map(data => mapArrayToFindAllProgramsResult(data));
}

function mapArrayToFindAllProgramsResult(data: any) {
	const result: FindAllProgramsResult = {
		id: data.id,
		programName: data.programName,
		windowTitle: data.windowTitle,
		startedAt: data.startedAt,
		endedAt: data.endedAt
	}
	return result;
}