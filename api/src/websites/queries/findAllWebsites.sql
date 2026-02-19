SELECT id, websiteTitle, websiteUrl, startedAt
FROM websites
WHERE startedAt > :startedAt AND startedAt < :endedAt
