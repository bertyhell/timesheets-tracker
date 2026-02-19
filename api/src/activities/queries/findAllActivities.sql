SELECT id, programName, windowTitle, startedAt, endedAt
FROM activities
WHERE startedAt > :startedAt AND endedAt < :endedAt

