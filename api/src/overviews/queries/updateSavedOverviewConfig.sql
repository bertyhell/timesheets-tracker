UPDATE savedOverviewConfigs
SET
    name = :name,
    dateRangeMode = :dateRangeMode,
    customStartedAt = :customStartedAt,
    customEndedAt = :customEndedAt,
    sourceTypes = :sourceTypes,
    reportState = :reportState,
    updatedAt = :updatedAt
WHERE id = :id
