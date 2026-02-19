SELECT id, isActive, startedAt, endedAt
FROM activeStates
WHERE id = :id
LIMIT 1
