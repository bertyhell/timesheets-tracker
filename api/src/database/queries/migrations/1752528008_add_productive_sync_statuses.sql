-- Records the outcome of the last Productive sync per tag name per day, so the sync modal can
-- show which tags landed, which failed and why, and default the failed ones back on for a retry.
--
-- Keyed by (tagNameId, date) rather than by tag name alone: a sync covers one day, so a tag that
-- synced yesterday must still default to "include" when syncing today.
--
-- "entries" holds the individual time entries as JSON ({ note, minutes, status, error }) instead of
-- a second table — a day holds a handful of entries per tag and they are only ever read as a block.
CREATE TABLE IF NOT EXISTS productiveSyncStatuses
(
    "tagNameId" text NOT NULL,
    "date"      text NOT NULL,
    "status"    text NOT NULL,
    "entries"   text NOT NULL,
    "syncedAt"  text NOT NULL,
    PRIMARY KEY ("tagNameId", "date")
);
