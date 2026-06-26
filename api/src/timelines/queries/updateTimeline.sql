UPDATE timelines
SET
    title = :title,
    timelineType = :timelineType,
    eventProviderInfo = :eventProviderInfo,
    updatedAt = :updatedAt,
    visualOrder = :visualOrder,
    color = :color
WHERE id = :id
