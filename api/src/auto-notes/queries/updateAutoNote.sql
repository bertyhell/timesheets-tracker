UPDATE autoNotes
SET
    `name` = :`name`
    tagNameIds = :tagNameIds
    variable = :variable
    extractRegex = :extractRegex
    extractRegexReplacement = :extractRegexReplacement
WHERE id = :id
