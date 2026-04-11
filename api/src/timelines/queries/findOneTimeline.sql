SELECT
    id,
    title,
    timelineType,
    eventProviderInfo,
    createdAt,
    updatedAt,
    visualOrder
FROM timelines
WHERE id = :id
LIMIT 1
