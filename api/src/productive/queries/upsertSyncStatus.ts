import type { DatabaseSync } from 'node:sqlite';

export type UpsertSyncStatusData = {
  status: string;
  entries: string;
  syncedAt: string;
};

export type UpsertSyncStatusParams = {
  tagNameId: string;
  date: string;
};

export type UpsertSyncStatusResult = {
  changes: number;
};

export function upsertSyncStatus(
  db: DatabaseSync,
  data: UpsertSyncStatusData,
  params: UpsertSyncStatusParams
): UpsertSyncStatusResult {
  // Re-syncing a day replaces that tag's previous outcome rather than appending, so the
  // modal always reflects the most recent attempt.
  const sql = `
	INSERT INTO productiveSyncStatuses (tagNameId, date, status, entries, syncedAt)
	VALUES (?, ?, ?, ?, ?)
	ON CONFLICT (tagNameId, date) DO UPDATE SET
	    status = excluded.status,
	    entries = excluded.entries,
	    syncedAt = excluded.syncedAt
	`;
  return db
    .prepare(sql)
    .run(
      params.tagNameId,
      params.date,
      data.status,
      data.entries,
      data.syncedAt
    ) as UpsertSyncStatusResult;
}
