UPDATE tagNames
SET
    title = :title,
    code = :code,
    color = :color,
    note = :note,
    canGrow = :canGrow
WHERE id = :id
