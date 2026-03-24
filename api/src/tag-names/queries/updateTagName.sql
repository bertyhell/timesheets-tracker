UPDATE tagNames
SET
    title = $title,
    code = $code,
    color = $color
WHERE id = $id
