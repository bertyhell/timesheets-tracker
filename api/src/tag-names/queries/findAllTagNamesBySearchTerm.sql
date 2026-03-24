SELECT id, title, code, color
FROM tagNames
WHERE title like '%' || $searchTerm || '%'
