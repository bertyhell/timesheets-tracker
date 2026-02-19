UPDATE activeStates
SET isActive = :isActive, startedAt = :startedAt, endedAt = :endedAt
WHERE id = :id
