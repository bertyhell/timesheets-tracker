SELECT
    id,
    title,
    url,
    color
FROM calendars
WHERE id = :id
LIMIT 1
