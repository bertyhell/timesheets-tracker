import type { Database } from 'bun:sqlite';

export type UpdateCalendarData = {
	title: string;
	url: string;
	color: string;
}

export type UpdateCalendarParams = {
	id: string;
}

export type UpdateCalendarResult = {
	changes: number;
}

export function updateCalendar(db: Database, data: UpdateCalendarData, params: UpdateCalendarParams): UpdateCalendarResult {
	const sql = `
	UPDATE calendars
	SET
	    title = ?,
	    url = ?,
	    color = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.title, data.url, data.color, params.id) as UpdateCalendarResult;
}