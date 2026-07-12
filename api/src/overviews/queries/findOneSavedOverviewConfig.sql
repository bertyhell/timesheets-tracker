SELECT id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, pivotState, createdAt, updatedAt
FROM savedOverviewConfigs
WHERE id = :id
LIMIT 1
