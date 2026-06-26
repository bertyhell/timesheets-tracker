INSERT INTO timelines
(
    id,
    title,
    timelineType,
    eventProviderInfo,
    createdAt,
    updatedAt,
    visualOrder,
    color
)
VALUES (:id, :title, :timelineType, :eventProviderInfo, :createdAt, :updatedAt, :visualOrder, :color)
