UPDATE timelines
SET
    title = :title,
    timelineType = :timelineType,
    eventProviderInfo = :eventProviderInfo,
    updatedAt = :updatedAt,
    visualOrder = :visualOrder
WHERE id = :id
