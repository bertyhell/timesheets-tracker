import type { Database } from 'bun:sqlite';

export type FindOneTimelineParams = {
	id: string;
}

export type FindOneTimelineResult = {
	id: string;
	title: string;
	timelineType: string;
	eventProviderInfo?: string;
	createdAt: string;
	updatedAt: string;
	visualOrder: number;
}

export function findOneTimeline(db: Database, params: FindOneTimelineParams): FindOneTimelineResult | null {
	const sql = `
	SELECT
	    id,
	    title,
	    timelineType,
	    eventProviderInfo,
	    createdAt,
	    updatedAt,
	    visualOrder
	FROM timelines
	WHERE id = ?
	LIMIT 1
	`
	const res = db.prepare(sql)
		.values(params.id);

	return res.length > 0 ? mapArrayToFindOneTimelineResult(res[0]) : null;
}

function mapArrayToFindOneTimelineResult(data: any) {
	const result: FindOneTimelineResult = {
		id: data[0],
		title: data[1],
		timelineType: data[2],
		eventProviderInfo: data[3],
		createdAt: data[4],
		updatedAt: data[5],
		visualOrder: data[6]
	}
	return result;
}