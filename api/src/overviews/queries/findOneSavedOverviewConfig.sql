SELECT id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, reportState, createdAt, updatedAt
FROM savedOverviewConfigs
WHERE id = :id
LIMIT 1
