CREATE TABLE IF NOT EXISTS programs
(
    "id"            text NOT NULL PRIMARY KEY,
    "programName"   text,
    "windowTitle"   text,
    "startedAt"     text NOT NULL,
    "endedAt"       text NOT NULL
);


CREATE TABLE IF NOT EXISTS websites
(
    "id"            text NOT NULL PRIMARY KEY,
    "websiteTitle"  text,
    "websiteUrl"    text,
    "startedAt"     text NOT NULL
);


CREATE TABLE IF NOT EXISTS activeStates
(
    "id"            text NOT NULL PRIMARY KEY,
    "isActive"      boolean,
    "startedAt"     text NOT NULL,
    "endedAt"       text NOT NULL
);


CREATE TABLE IF NOT EXISTS tagNames
(
    "id"    text NOT NULL PRIMARY KEY,
    "title" text NOT NULL,
    "code"  text,
    "color" text NOT NULL
);


CREATE TABLE IF NOT EXISTS tags
(
    "id"        text NOT NULL PRIMARY KEY,
    "tagNameId" text NOT NULL,
    "startedAt" text NOT NULL,
    "endedAt"   text NOT NULL,
    "note"      text,
    FOREIGN KEY ("tagNameId") REFERENCES "tagNames" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS autoTags
(
    "id"            text NOT NULL PRIMARY KEY,
    "title"         text NOT NULL,
    "tagNameId"     text NOT NULL,
    "priority"      int NOT NULL,
    "conditions"    text NOT NULL,
    FOREIGN KEY ("tagNameId") REFERENCES "tagNames" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE IF NOT EXISTS calendars
(
    "id"    text NOT NULL PRIMARY KEY,
    "title" text NOT NULL,
    "url"   text NOT NULL,
    "color" text NOT NULL
);


CREATE TABLE IF NOT EXISTS autoNotes
(
    "id"                        text NOT NULL PRIMARY KEY,
    "title"                     text NOT NULL,
    "tagNameId"                 text,
    "variable"                  text NOT NULL,
    "extractRegex"              text,
    "extractRegexReplacement"   text
);


CREATE TABLE IF NOT EXISTS timelines
(
    "id"                text NOT NULL PRIMARY KEY,
    "title"             text NOT NULL,
    "timelineType"      text NOT NULL,
    "eventProviderInfo" text,
    "createdAt"         text NOT NULL,
    "updatedAt"         text NOT NULL,
    "visualOrder"       int NOT NULL
);


CREATE TABLE IF NOT EXISTS integrations
(
    "type"           text NOT NULL PRIMARY KEY,
    "baseUrl"        text NOT NULL,
    "organisationId" text NOT NULL,
    "userId"         text NOT NULL DEFAULT '',
    "token"          text NOT NULL
);


CREATE TABLE IF NOT EXISTS savedOverviewConfigs
(
    "id"                text NOT NULL PRIMARY KEY,
    "name"              text NOT NULL,
    "visualOrder"       int NOT NULL,
    "dateRangeMode"     text NOT NULL,
    "customStartedAt"   text,
    "customEndedAt"     text,
    "sourceTypes"       text NOT NULL,
    "pivotState"        text NOT NULL,
    "createdAt"         text NOT NULL,
    "updatedAt"         text NOT NULL
);


-- Indexes.
--
-- The event tables (programs, websites, activeStates, tags) grow without bound and are always
-- read as a time range for a single day, purged with "startedAt < x", and — for websites —
-- probed for "the first event after x" on every clamp and for an exact startedAt match on
-- every insert from the browser extension. Without an index on startedAt each of those is a
-- full table scan plus a temp b-tree sort.
-- (cachedNetworkRequests is created by a migration, so its index lives there too.)
CREATE INDEX IF NOT EXISTS idx_programs_startedAt ON programs ("startedAt");
CREATE INDEX IF NOT EXISTS idx_websites_startedAt ON websites ("startedAt");
CREATE INDEX IF NOT EXISTS idx_activeStates_startedAt ON activeStates ("startedAt");
CREATE INDEX IF NOT EXISTS idx_tags_startedAt ON tags ("startedAt");

-- SQLite needs an index on the child side of a foreign key to cascade a delete without
-- scanning the whole child table, so deleting a tagName would otherwise scan tags and autoTags.
CREATE INDEX IF NOT EXISTS idx_tags_tagNameId ON tags ("tagNameId");
CREATE INDEX IF NOT EXISTS idx_autoTags_tagNameId ON autoTags ("tagNameId");

-- Deliberately not indexed: tagNames, calendars, autoNotes, timelines, integrations, settings
-- and savedOverviewConfigs are all configuration tables of at most a few dozen rows, read by
-- primary key or with a full-table LIKE '%term%' that no index can serve.
