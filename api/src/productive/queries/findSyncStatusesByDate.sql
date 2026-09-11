SELECT tagNameId, date, status, entries, syncedAt
FROM productiveSyncStatuses
WHERE date = :date
