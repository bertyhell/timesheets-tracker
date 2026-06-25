import type { DatabaseSync } from 'node:sqlite';

export type FindAllCalendarsResult = {
  id: string;
  title: string;
  url: string;
  color: string;
};

export function findAllCalendars(db: DatabaseSync): FindAllCalendarsResult[] {
  const sql = `
	SELECT
	    id,
	    title,
	    url,
	    color
	FROM calendars
	`;
  return db
    .prepare(sql)
    .all()
    .map((data) => mapArrayToFindAllCalendarsResult(data));
}

function mapArrayToFindAllCalendarsResult(data: any) {
  const result: FindAllCalendarsResult = {
    id: data.id,
    title: data.title,
    url: data.url,
    color: data.color,
  };
  return result;
}
