UPDATE tagNames
SET
    `name` = :`name`
    code = :code
    color = :color
WHERE id = :id
