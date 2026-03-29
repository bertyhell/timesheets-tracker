import type { Database } from 'bun:sqlite';

export type FindAllActivitiesParams = {
	startedAt: string;
	endedAt: string;
}

export type FindAllActivitiesResult = {
	id: string;
	programName?: string;
	windowTitle?: string;
	startedAt: string;
	endedAt: string;
}

export function findAllActivities(db: Database, params: FindAllActivitiesParams): FindAllActivitiesResult[] {
	const sql = `
	SELECT id, programName, windowTitle, startedAt, endedAt
	FROM activities
	WHERE startedAt > ? AND endedAt < ?
	`
	return db.prepare(sql)
		.values(params.startedAt, params.endedAt)
		.map(data => mapArrayToFindAllActivitiesResult(data));
}

function mapArrayToFindAllActivitiesResult(data: any) {
	const result: FindAllActivitiesResult = {
		id: data[0],
		programName: data[1],
		windowTitle: data[2],
		startedAt: data[3],
		endedAt: data[4]
	}
	return result;
}