SELECT id, title, tagNameId, variable, extractRegex, extractRegexReplacement
FROM autoNotes
WHERE id = $id
LIMIT 1
