import type { DatabaseSync } from 'node:sqlite';

export type FindAllTimelinesBySearchTermParams = {
	searchTerm: string;
}

export type FindAllTimelinesBySearchTermResult = {
	id: string;
	title: string;
	timelineType: string;
	eventProviderInfo?: string;
	createdAt: string;
	updatedAt: string;
	visualOrder: number;
}

export function findAllTimelinesBySearchTerm(db: DatabaseSync, params: FindAllTimelinesBySearchTermParams): FindAllTimelinesBySearchTermResult[] {
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
	WHERE title like '%' || ? || '%'
	ORDER BY visualOrder ASC
	`
	return db.prepare(sql)
		.all(params.searchTerm)
		.map(data => mapArrayToFindAllTimelinesBySearchTermResult(data));
}

function mapArrayToFindAllTimelinesBySearchTermResult(data: any) {
	const result: FindAllTimelinesBySearchTermResult = {
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