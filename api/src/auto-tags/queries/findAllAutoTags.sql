SELECT
    autoTags.id,
    autoTags.title,
    autoTags.tagNameId,
    autoTags.priority,
    autoTags.conditions,
    tagNames.id as "tagName.id",
    tagNames.title as "tagName.title",
    tagNames.color as "tagName.color"
FROM autoTags
LEFT JOIN tagNames ON tagNames.id = autoTags.tagNameId



