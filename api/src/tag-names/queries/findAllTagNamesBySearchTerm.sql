SELECT id, `name`, code, color
FROM tagNames
WHERE `name` like '%' + :searchTerm + '%'
