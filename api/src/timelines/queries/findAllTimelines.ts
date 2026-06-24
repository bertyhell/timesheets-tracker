import type { DatabaseSync } from 'node:sqlite';

export type FindAllTimelinesResult = {
	id: string;
	title: string;
	timelineType: string;
	eventProviderInfo?: string;
	createdAt: string;
	updatedAt: string;
	visualOrder: number;
}

export function findAllTimelines(db: DatabaseSync): FindAllTimelinesResult[] {
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
	ORDER BY visualOrder ASC
	`
	return db.prepare(sql)
		.all()
		.map(data => mapArrayToFindAllTimelinesResult(data));
}

function mapArrayToFindAllTimelinesResult(data: any) {
	const result: FindAllTimelinesResult = {
		id: data.id,
		title: data.title,
		timelineType: data.timelineType,
		eventProviderInfo: data.eventProviderInfo,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
		visualOrder: data.visualOrder
	}
	return result;
}