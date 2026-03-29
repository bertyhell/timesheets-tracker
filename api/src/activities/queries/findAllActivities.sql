SELECT id, programName, windowTitle, startedAt, endedAt
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY (julianday(endedAt) - julianday(startedAt)) DESC) as rn
    FROM activities
    WHERE startedAt > :startedAt AND endedAt < :endedAt
)
WHERE rn = 1

