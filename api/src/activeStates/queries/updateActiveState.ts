import type { Database } from 'bun:sqlite';

export type UpdateActiveStateData = {
	param1: number | null;
	param2: string;
	param3: string;
}

export type UpdateActiveStateParams = {
	param1: string;
}

export type UpdateActiveStateResult = {
	changes: number;
}

export function updateActiveState(db: Database, data: UpdateActiveStateData, params: UpdateActiveStateParams): UpdateActiveStateResult {
	const sql = `
	UPDATE activeStates
	SET isActive = $isActive, startedAt = $startedAt, endedAt = $endedAt
	WHERE id = $id
	
	`
	return db.prepare(sql)
		.run(data.param1, data.param2, data.param3, params.param1) as UpdateActiveStateResult;
}