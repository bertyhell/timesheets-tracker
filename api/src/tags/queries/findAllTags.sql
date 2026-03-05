SELECT
    tags.id as id,
    tags.tagNameId as tagNameId,
    tags.startedAt as startedAt,
    tags.endedAt as endedAt,
    tagNames.id as `tagName.id`,
    tagNames.name as `tagName.name`,
    tagNames.color as `tagName.color`
FROM tags
LEFT JOIN tagNames ON tagNames.id = tags.tagNameId
WHERE startedAt > '$startedAt' AND endedAt < '$endedAt'
