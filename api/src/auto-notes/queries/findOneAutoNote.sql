SELECT id, `name`, tagNameIds, variable, extractRegex, extractRegexReplacement
FROM autoNotes
WHERE id = :id
LIMIT 1
