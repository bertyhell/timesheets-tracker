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
WHERE title like '%' || :searchTerm || '%'
ORDER BY visualOrder ASC
