SELECT
    tags.id as id,
    tags.tagNameId as tagNameId,
    tags.startedAt as startedAt,
    tags.endedAt as endedAt,
    tagNames.id as "tagName.id",
    tagNames.title as "tagName.title",
    tagNames.color as "tagName.color"
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY (julianday(endedAt) - julianday(startedAt)) DESC) as rn
    FROM tags
    WHERE startedAt > :startedAt AND endedAt < :endedAt
) tags
LEFT JOIN tagNames ON tagNames.id = tags.tagNameId
WHERE tags.rn = 1
