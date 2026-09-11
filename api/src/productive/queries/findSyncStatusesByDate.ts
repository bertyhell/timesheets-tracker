import type { DatabaseSync } from 'node:sqlite';

export type FindSyncStatusesByDateParams = {
  date: string;
};

export type FindSyncStatusesByDateResult = {
  tagNameId: string;
  date: string;
  status: string;
  entries: string;
  syncedAt: string;
};

export function findSyncStatusesByDate(
  db: DatabaseSync,
  params: FindSyncStatusesByDateParams
): FindSyncStatusesByDateResult[] {
  const sql = `
	SELECT tagNameId, date, status, entries, syncedAt
	FROM productiveSyncStatuses
	WHERE date = ?
	`;
  return db.prepare(sql).all(params.date) as FindSyncStatusesByDateResult[];
}
