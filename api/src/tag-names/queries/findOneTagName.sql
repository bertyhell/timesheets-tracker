SELECT id, title, code, color, note
FROM tagNames
WHERE id = :id
LIMIT 1
