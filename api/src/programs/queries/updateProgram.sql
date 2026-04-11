UPDATE programs
SET
    programName = :programName,
    windowTitle = :windowTitle,
    startedAt = :startedAt,
    endedAt = :endedAt
WHERE id = :id
