SELECT id, title, code, color, note
FROM tagNames
WHERE title like '%' || :searchTerm || '%'
