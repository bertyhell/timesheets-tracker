import type { Database } from 'bun:sqlite';

export type CreateTimelineParams = {
	id: string;
	title: string;
	timelineType: string;
	eventProviderInfo: string | null;
	createdAt: string;
	updatedAt: string;
	visualOrder: number;
}

export type CreateTimelineResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createTimeline(db: Database, params: CreateTimelineParams): CreateTimelineResult {
	const sql = `
	INSERT INTO timelines
	(
	    id,
	    title,
	    timelineType,
	    eventProviderInfo,
	    createdAt,
	    updatedAt,
	    visualOrder
	)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	return db.prepare(sql)
		.run(params.id, params.title, params.timelineType, params.eventProviderInfo, params.createdAt, params.updatedAt, params.visualOrder) as CreateTimelineResult;
}