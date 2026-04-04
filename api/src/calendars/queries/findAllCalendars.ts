import type { Database } from 'bun:sqlite';

export type FindAllCalendarsResult = {
	id: string;
	title: string;
	url: string;
	color: string;
}

export function findAllCalendars(db: Database): FindAllCalendarsResult[] {
	const sql = `
	SELECT
	    id,
	    title,
	    url,
	    color
	FROM calendars
	`
	return db.prepare(sql)
		.values()
		.map(data => mapArrayToFindAllCalendarsResult(data));
}

function mapArrayToFindAllCalendarsResult(data: any) {
	const result: FindAllCalendarsResult = {
		id: data[0],
		title: data[1],
		url: data[2],
		color: data[3]
	}
	return result;
}