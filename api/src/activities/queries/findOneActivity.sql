SELECT id, programName, windowTitle, startedAt, endedAt
FROM activities
WHERE id = :id
LIMIT 1
