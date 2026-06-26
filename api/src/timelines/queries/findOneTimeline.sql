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
WHERE id = :id
LIMIT 1
