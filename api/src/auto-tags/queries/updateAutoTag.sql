UPDATE autoTags
SET
    title = :title,
    tagNameId = :tagNameId,
    priority = :priority,
    conditions = :conditions
WHERE id = :id
