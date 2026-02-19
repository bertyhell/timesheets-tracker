UPDATE autoTags
SET
    name = $name,
    tagNameId = $tagNameId,
    variable = $variable 
    extractRegex = $extractRegex 
    extractRegexReplacement = $extractRegexReplacement 
WHERE id = $id
