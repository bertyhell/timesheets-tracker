import type { Database } from 'bun:sqlite';

export type FindOneActiveStateParams = {
	id: string;
}

export type FindOneActiveStateResult = {
	id: string;
	isActive?: number;
	startedAt: string;
	endedAt: string;
}

export function findOneActiveState(db: Database, params: FindOneActiveStateParams): FindOneActiveStateResult | null {
	const sql = `
	SELECT id, isActive, startedAt, endedAt
	FROM activeStates
	WHERE id = ?
	LIMIT 1
	`
	const res = db.prepare(sql)
		.values(params.id);

	return res.length > 0 ? mapArrayToFindOneActiveStateResult(res[0]) : null;
}

function mapArrayToFindOneActiveStateResult(data: any) {
	const result: FindOneActiveStateResult = {
		id: data[0],
		isActive: data[1],
		startedAt: data[2],
		endedAt: data[3]
	}
	return result;
}