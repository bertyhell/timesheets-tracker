import type { DatabaseSync } from 'node:sqlite';

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

export function findAllActiveStates(db: DatabaseSync, params: FindAllActiveStatesParams): FindAllActiveStatesResult[] {
	const sql = `
	SELECT id, isActive, startedAt, endedAt
	FROM (
	    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY (julianday(endedAt) - julianday(startedAt)) DESC) as rn
	    FROM activeStates
	    WHERE startedAt > ? AND endedAt < ?
	)
	WHERE rn = 1
	`
	return db.prepare(sql)
		.all(params.startedAt, params.endedAt)
		.map(data => mapArrayToFindAllActiveStatesResult(data));
}

function mapArrayToFindAllActiveStatesResult(data: any) {
	const result: FindAllActiveStatesResult = {
		id: data.id,
		isActive: data.isActive,
		startedAt: data.startedAt,
		endedAt: data.endedAt
	}
	return result;
}