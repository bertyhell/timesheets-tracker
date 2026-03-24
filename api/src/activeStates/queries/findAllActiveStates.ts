import type { Database } from 'bun:sqlite';

export type FindAllActiveStatesParams = {
	param1: string;
	param2: string;
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
	WHERE startedAt > $startedAt AND endedAt < $endedAt
	
	`
	return db.prepare(sql)
		.values(params.param1, params.param2)
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