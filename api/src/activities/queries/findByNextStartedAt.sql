SELECT id, programName, windowTitle, startedAt, endedAt
FROM activities
WHERE startedAt > :startedAt
ORDER BY startedAt
limit 1

