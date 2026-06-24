import type { DatabaseSync } from 'node:sqlite';

export type FindOneActiveStateParams = {
	id: string;
}

export type FindOneActiveStateResult = {
	id: string;
	isActive?: number;
	startedAt: string;
	endedAt: string;
}

export function findOneActiveState(db: DatabaseSync, params: FindOneActiveStateParams): FindOneActiveStateResult | null {
	const sql = `
	SELECT id, isActive, startedAt, endedAt
	FROM activeStates
	WHERE id = ?
	LIMIT 1
	`
	return db.prepare(sql).get(params.id) as FindOneActiveStateResult | null ?? null;
}
