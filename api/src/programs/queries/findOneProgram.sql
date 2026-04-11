SELECT id, programName, windowTitle, startedAt, endedAt
FROM programs
WHERE id = :id
LIMIT 1
