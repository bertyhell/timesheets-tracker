CREATE TABLE IF NOT EXISTS settings
(
    "key"       text NOT NULL PRIMARY KEY,
    "value"     text,
    "createdAt" text NOT NULL DEFAULT (datetime('now')),
    "updatedAt" text NOT NULL DEFAULT (datetime('now'))
);
