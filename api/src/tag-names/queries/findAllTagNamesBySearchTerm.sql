SELECT id, title, code, color, note, canGrow
FROM tagNames
WHERE title like '%' || :searchTerm || '%'
