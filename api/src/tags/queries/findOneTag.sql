SELECT
    tags.id as id,
    tags.tagNameId as tagNameId,
    tags.startedAt as startedAt,
    tags.endedAt as endedAt,
    tagNames.id as "tagName.id",
    tagNames.title as "tagName.title",
    tagNames.color as "tagName.color"
FROM tags
LEFT JOIN tagNames ON tagNames.id = tags.tagNameId
WHERE tags.id = $id
LIMIT 1
