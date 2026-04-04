import type { Database } from 'bun:sqlite';

export type DeleteCalendarParams = {
	id: string;
}

export type DeleteCalendarResult = {
	changes: number;
}

export function deleteCalendar(db: Database, params: DeleteCalendarParams): DeleteCalendarResult {
	const sql = `
	DELETE FROM calendars
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(params.id) as DeleteCalendarResult;
}