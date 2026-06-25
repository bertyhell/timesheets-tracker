import type { DatabaseSync } from 'node:sqlite';

export type DeleteCalendarParams = {
  id: string;
};

export type DeleteCalendarResult = {
  changes: number;
};

export function deleteCalendar(
  db: DatabaseSync,
  params: DeleteCalendarParams
): DeleteCalendarResult {
  const sql = `
	DELETE FROM calendars
	WHERE id = ?
	`;
  return db.prepare(sql).run(params.id) as DeleteCalendarResult;
}
