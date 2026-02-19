SELECT id, `name`, code, color
FROM tagNames
WHERE id = :id
LIMIT 1
