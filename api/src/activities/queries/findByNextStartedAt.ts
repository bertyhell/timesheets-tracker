import type { Database } from 'bun:sqlite';

export type FindByNextStartedAtParams = {
	startedAt: string;
}

export type FindByNextStartedAtResult = {
	id: string;
	programName?: string;
	windowTitle?: string;
	startedAt: string;
	endedAt: string;
}

export function findByNextStartedAt(db: Database, params: FindByNextStartedAtParams): FindByNextStartedAtResult | null {
	const sql = `
	SELECT id, programName, windowTitle, startedAt, endedAt
	FROM activities
	WHERE startedAt > ?
	ORDER BY startedAt
	limit 1
	`
	const res = db.prepare(sql)
		.values(params.startedAt);

	return res.length > 0 ? mapArrayToFindByNextStartedAtResult(res[0]) : null;
}

function mapArrayToFindByNextStartedAtResult(data: any) {
	const result: FindByNextStartedAtResult = {
		id: data[0],
		programName: data[1],
		windowTitle: data[2],
		startedAt: data[3],
		endedAt: data[4]
	}
	return result;
}