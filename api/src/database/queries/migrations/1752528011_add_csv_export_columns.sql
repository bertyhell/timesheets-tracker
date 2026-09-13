-- Column definitions for the Excel CSV export integration: one row per column in the produced file.
--
-- The user names each column and picks what goes in it, so this is user data rather than a fixed
-- schema — hence a table rather than a hardcoded column list. `visualOrder` is the left-to-right
-- order in the file, which is why the settings screen lets these be dragged.
--
-- `format` is only meaningful for the duration/time/date values (the text ones store ''), and
-- `staticText` only for value = 'staticText'. Both are kept as plain columns rather than a JSON
-- config blob so the rows stay greppable and typed like every other table here.
CREATE TABLE IF NOT EXISTS csvExportColumns (
  "id"          text NOT NULL PRIMARY KEY,
  "header"      text NOT NULL,
  "value"       text NOT NULL,
  "format"      text NOT NULL DEFAULT '',
  "staticText"  text NOT NULL DEFAULT '',
  "visualOrder" int  NOT NULL
);
