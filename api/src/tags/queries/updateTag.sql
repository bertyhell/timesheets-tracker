UPDATE tags
SET
    tagNameId = :tagNameId,
    startedAt = :startedAt,
    endedAt = :endedAt,
    note = :note
WHERE id = :id
