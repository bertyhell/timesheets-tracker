SELECT id, websiteTitle, websiteUrl, startedAt
FROM websites
WHERE startedAt = :startedAt
LIMIT 1
