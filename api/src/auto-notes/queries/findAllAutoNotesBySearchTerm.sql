SELECT id, `name`, tagNameIds, variable, extractRegex, extractRegexReplacement
FROM autoNotes
WHERE `name` like '%' + :searchTerm + '%'
