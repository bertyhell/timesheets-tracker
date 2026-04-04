import type { Database } from 'bun:sqlite';

export type FindOneCalendarParams = {
	id: string;
}

export type FindOneCalendarResult = {
	id: string;
	title: string;
	url: string;
	color: string;
}

export function findOneCalendar(db: Database, params: FindOneCalendarParams): FindOneCalendarResult | null {
	const sql = `
	SELECT
	    id,
	    title,
	    url,
	    color
	FROM calendars
	WHERE id = ?
	LIMIT 1
	`
	const res = db.prepare(sql)
		.values(params.id);

	return res.length > 0 ? mapArrayToFindOneCalendarResult(res[0]) : null;
}

function mapArrayToFindOneCalendarResult(data: any) {
	const result: FindOneCalendarResult = {
		id: data[0],
		title: data[1],
		url: data[2],
		color: data[3]
	}
	return result;
}