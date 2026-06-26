SELECT
    id,
    title,
    timelineType,
    eventProviderInfo,
    createdAt,
    updatedAt,
    visualOrder,
    color
FROM timelines
ORDER BY visualOrder ASC
