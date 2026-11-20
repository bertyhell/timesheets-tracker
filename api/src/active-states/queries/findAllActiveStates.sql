SELECT id, isActive, startedAt, endedAt
FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY (julianday(endedAt) - julianday(startedAt)) DESC) as rn
    FROM activeStates
    WHERE endedAt > :startedAt AND startedAt < :endedAt
)
WHERE rn = 1

