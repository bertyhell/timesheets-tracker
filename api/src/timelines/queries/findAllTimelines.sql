SELECT
    id,
    title,
    timelineType,
    eventProviderInfo,
    createdAt,
    updatedAt,
    visualOrder
FROM timelines
ORDER BY visualOrder ASC
