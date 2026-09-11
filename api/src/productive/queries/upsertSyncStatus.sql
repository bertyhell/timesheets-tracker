INSERT INTO productiveSyncStatuses (tagNameId, date, status, entries, syncedAt)
VALUES (:tagNameId, :date, :status, :entries, :syncedAt)
ON CONFLICT (tagNameId, date) DO UPDATE SET
    status = excluded.status,
    entries = excluded.entries,
    syncedAt = excluded.syncedAt
