import type { Database } from 'bun:sqlite';

export type FindAllTimelinesResult = {
	id: string;
	title: string;
	timelineType: string;
	eventProviderInfo?: string;
	createdAt: string;
	updatedAt: string;
	visualOrder: number;
}

export function findAllTimelines(db: Database): FindAllTimelinesResult[] {
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
		.values()
		.map(data => mapArrayToFindAllTimelinesResult(data));
}

function mapArrayToFindAllTimelinesResult(data: any) {
	const result: FindAllTimelinesResult = {
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