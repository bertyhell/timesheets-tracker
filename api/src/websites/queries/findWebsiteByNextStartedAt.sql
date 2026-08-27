SELECT id, websiteTitle, websiteUrl, startedAt
FROM websites
WHERE startedAt > :startedAt
ORDER BY startedAt
limit 1
