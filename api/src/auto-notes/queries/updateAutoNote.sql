UPDATE autoNotes
SET
    title = :title,
    tagNameId = :tagNameId,
    variable = :variable,
    extractRegex = :extractRegex,
    extractRegexReplacement = :extractRegexReplacement
WHERE id = :id
