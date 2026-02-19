SELECT id, websiteTitle, websiteUrl, startedAt
FROM websites
WHERE id = :id
LIMIT 1
