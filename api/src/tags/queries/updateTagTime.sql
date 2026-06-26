UPDATE tags
SET
    startedAt = :startedAt,
    endedAt = :endedAt
WHERE id = :id
