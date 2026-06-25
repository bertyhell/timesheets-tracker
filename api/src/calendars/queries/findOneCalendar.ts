import type { DatabaseSync } from 'node:sqlite';

export type FindOneCalendarParams = {
  id: string;
};

export type FindOneCalendarResult = {
  id: string;
  title: string;
  url: string;
  color: string;
};

export function findOneCalendar(
  db: DatabaseSync,
  params: FindOneCalendarParams
): FindOneCalendarResult | null {
  const sql = `
	SELECT
	    id,
	    title,
	    url,
	    color
	FROM calendars
	WHERE id = ?
	LIMIT 1
	`;
  return (db.prepare(sql).get(params.id) as FindOneCalendarResult | null) ?? null;
}
