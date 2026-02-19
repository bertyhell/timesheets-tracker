SELECT id, isActive, startedAt, endedAt
FROM activeStates
WHERE startedAt > :startedAt AND endedAt < :endedAt
