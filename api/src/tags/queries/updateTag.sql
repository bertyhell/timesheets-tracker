UPDATE tagNames
SET
    tagNameId = :tagNameId,
    startedAt = :startedAt,
    endedAt = :endedAt
WHERE id = :id
