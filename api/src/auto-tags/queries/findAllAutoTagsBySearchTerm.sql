SELECT
    autoTags.id,
    autoTags.name,
    autoTags.tagNameId,
    autoTags.priority,
    autoTags.conditions,
    tagNames.id as `tagName.id`,
    tagNames.name as `tagName.name`,
    tagNames.color as `tagName.color`
FROM autoTags
WHERE `name` like '%' + :searchTerm + '%'
