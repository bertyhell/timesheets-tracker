UPDATE websites
SET
    websiteTitle = :websiteTitle,
    websiteUrl = :websiteUrl,
    startedAt = :startedAt
WHERE id = :id
