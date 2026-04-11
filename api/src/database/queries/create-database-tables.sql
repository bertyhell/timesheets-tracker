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


INSERT OR IGNORE INTO timelines ("id", "title", "timelineType", "eventProviderInfo", "createdAt", "updatedAt", "visualOrder")
VALUES ('a9551a4a-46c8-4c7d-a859-9a9ac58daea3', 'Active', 'ActiveState', NULL, datetime('now'), datetime('now'), 1);

INSERT OR IGNORE INTO timelines ("id", "title", "timelineType", "eventProviderInfo", "createdAt", "updatedAt", "visualOrder")
VALUES ('eaf34527-d703-42ed-afef-05d40d393f87', 'Tags', 'Tag', NULL, datetime('now'), datetime('now'), 2);

INSERT OR IGNORE INTO timelines ("id", "title", "timelineType", "eventProviderInfo", "createdAt", "updatedAt", "visualOrder")
VALUES ('a19cd0f7-13bb-4a57-8c34-789cae4dcb10', 'Auto Tags', 'AutoTag', NULL, datetime('now'), datetime('now'), 3);

INSERT OR IGNORE INTO timelines ("id", "title", "timelineType", "eventProviderInfo", "createdAt", "updatedAt", "visualOrder")
VALUES ('614f6de5-b1e2-43fa-8da6-37b14fbc9e09', 'Programs', 'Program', NULL, datetime('now'), datetime('now'), 4);

INSERT OR IGNORE INTO timelines ("id", "title", "timelineType", "eventProviderInfo", "createdAt", "updatedAt", "visualOrder")
VALUES ('3357ae8e-6162-4fb2-a2be-bf9499b5a3d2', 'Websites', 'Website', NULL, datetime('now'), datetime('now'), 5);
