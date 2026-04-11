import type { Database } from 'bun:sqlite';

export type DeleteTimelineParams = {
	id: string;
}

export type DeleteTimelineResult = {
	changes: number;
}

export function deleteTimeline(db: Database, params: DeleteTimelineParams): DeleteTimelineResult {
	const sql = `
	DELETE FROM timelines
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteTimelineResult;
}