import type { Database } from 'bun:sqlite';

export type UpdateTimelineData = {
	title: string;
	timelineType: string;
	eventProviderInfo: string | null;
	updatedAt: string;
	visualOrder: number;
}

export type UpdateTimelineParams = {
	id: string;
}

export type UpdateTimelineResult = {
	changes: number;
}

export function updateTimeline(db: Database, data: UpdateTimelineData, params: UpdateTimelineParams): UpdateTimelineResult {
	const sql = `
	UPDATE timelines
	SET
	    title = ?,
	    timelineType = ?,
	    eventProviderInfo = ?,
	    updatedAt = ?,
	    visualOrder = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.title, data.timelineType, data.eventProviderInfo, data.updatedAt, data.visualOrder, params.id) as UpdateTimelineResult;
}