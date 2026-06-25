import type { DatabaseSync } from 'node:sqlite';

export type CreateCalendarParams = {
  id: string;
  title: string;
  url: string;
  color: string;
};

export type CreateCalendarResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createCalendar(
  db: DatabaseSync,
  params: CreateCalendarParams
): CreateCalendarResult {
  const sql = `
	INSERT INTO calendars
	(
	    id,
	    title,
	    url,
	    color
	)
	VALUES (?, ?, ?, ?)
	`;
  return db
    .prepare(sql)
    .run(params.id, params.title, params.url, params.color) as CreateCalendarResult;
}
