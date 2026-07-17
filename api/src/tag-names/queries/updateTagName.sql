UPDATE tagNames
SET
    title = :title,
    code = :code,
    color = :color,
    note = :note
WHERE id = :id
