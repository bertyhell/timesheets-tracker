import type { Database } from 'bun:sqlite';

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

export function findAllTimelinesBySearchTerm(db: Database, params: FindAllTimelinesBySearchTermParams): FindAllTimelinesBySearchTermResult[] {
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
		.values(params.searchTerm)
		.map(data => mapArrayToFindAllTimelinesBySearchTermResult(data));
}

function mapArrayToFindAllTimelinesBySearchTermResult(data: any) {
	const result: FindAllTimelinesBySearchTermResult = {
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