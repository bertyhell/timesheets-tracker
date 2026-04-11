SELECT
    id,
    title,
    timelineType,
    eventProviderInfo,
    createdAt,
    updatedAt,
    visualOrder
FROM timelines
WHERE title like '%' || :searchTerm || '%'
ORDER BY visualOrder ASC
