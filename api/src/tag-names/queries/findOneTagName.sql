SELECT id, title, code, color
FROM tagNames
WHERE id = $id
LIMIT 1
