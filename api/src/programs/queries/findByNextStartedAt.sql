SELECT id, programName, windowTitle, startedAt, endedAt
FROM programs
WHERE startedAt > :startedAt
ORDER BY startedAt
limit 1

