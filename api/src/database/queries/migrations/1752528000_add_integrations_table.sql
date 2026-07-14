CREATE TABLE IF NOT EXISTS integrations
(
    "type"           text NOT NULL PRIMARY KEY,
    "baseUrl"        text NOT NULL,
    "organisationId" text NOT NULL,
    "token"          text NOT NULL
);
