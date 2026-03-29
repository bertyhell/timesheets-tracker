SELECT id, websiteTitle, websiteUrl, startedAt
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY id) as rn
    FROM websites
    WHERE startedAt > :startedAt AND startedAt < :endedAt
)
WHERE rn = 1

