SELECT
    autoTags.id,
    autoTags.name,
    autoTags.tagNameId,
    autoTags.priority,
    autoTags.conditions,
    tagNames.id as "tagName.id",
    tagNames.name as "tagName.name",
    tagNames.color as "tagName.color"
FROM autoTags
LEFT JOIN tagNames ON tagNames.id = autoTags.tagNameId
WHERE autoTags.name like '%' || $searchTerm || '%'
