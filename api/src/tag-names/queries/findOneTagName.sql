SELECT id, title, code, color, note, canGrow
FROM tagNames
WHERE id = :id
LIMIT 1
