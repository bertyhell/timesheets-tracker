SELECT id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, pivotState, createdAt, updatedAt
FROM savedOverviewConfigs
ORDER BY visualOrder ASC, createdAt ASC
