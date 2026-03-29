import type { Database } from 'bun:sqlite';

export type FindAllActiveStatesParams = {
	startedAt: string;
	endedAt: string;
}

export type FindAllActiveStatesResult = {
	id: string;
	isActive?: number;
	startedAt: string;
	endedAt: string;
}

export function findAllActiveStates(db: Database, params: FindAllActiveStatesParams): FindAllActiveStatesResult[] {
	const sql = `
	SELECT id, isActive, startedAt, endedAt
	FROM activeStates
	WHERE startedAt > ? AND endedAt < ?
	`
	return db.prepare(sql)
		.values(params.startedAt, params.endedAt)
		.map(data => mapArrayToFindAllActiveStatesResult(data));
}

function mapArrayToFindAllActiveStatesResult(data: any) {
	const result: FindAllActiveStatesResult = {
		id: data[0],
		isActive: data[1],
		startedAt: data[2],
		endedAt: data[3]
	}
	return result;
}