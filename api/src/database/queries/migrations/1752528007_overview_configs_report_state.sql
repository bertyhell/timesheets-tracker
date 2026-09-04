-- Overviews switched from a drag-and-drop pivot table to a fixed catalogue of chart reports,
-- so the stored "pivotState" (react-pivottable rows/cols/vals) no longer describes anything the
-- app can render. The column is replaced by "reportState" (report id + its tweakable options).
--
-- The table is rebuilt rather than renamed with ALTER TABLE ... RENAME COLUMN, because migrations
-- also run against a freshly created database where the base schema already has "reportState" and
-- no "pivotState" at all: the SELECT below only names columns that exist in both schemas, so this
-- is a no-op rebuild on a fresh database and a real migration on an existing one.
--
-- Saved overviews keep their name, order, date range and sources; their state is reset to '{}',
-- which the client resolves to the default report options.
CREATE TABLE savedOverviewConfigs_reportState
(
    "id"                text NOT NULL PRIMARY KEY,
    "name"              text NOT NULL,
    "visualOrder"       int NOT NULL,
    "dateRangeMode"     text NOT NULL,
    "customStartedAt"   text,
    "customEndedAt"     text,
    "sourceTypes"       text NOT NULL,
    "reportState"       text NOT NULL,
    "createdAt"         text NOT NULL,
    "updatedAt"         text NOT NULL
);

INSERT INTO savedOverviewConfigs_reportState
    (id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, reportState, createdAt, updatedAt)
SELECT id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, '{}', createdAt, updatedAt
FROM savedOverviewConfigs;

DROP TABLE savedOverviewConfigs;

ALTER TABLE savedOverviewConfigs_reportState RENAME TO savedOverviewConfigs;
