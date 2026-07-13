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
