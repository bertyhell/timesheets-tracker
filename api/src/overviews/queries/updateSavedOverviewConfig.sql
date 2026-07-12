UPDATE savedOverviewConfigs
SET
    name = :name,
    dateRangeMode = :dateRangeMode,
    customStartedAt = :customStartedAt,
    customEndedAt = :customEndedAt,
    sourceTypes = :sourceTypes,
    pivotState = :pivotState,
    updatedAt = :updatedAt
WHERE id = :id
