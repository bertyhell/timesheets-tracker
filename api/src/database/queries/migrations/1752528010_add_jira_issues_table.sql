-- Ticket info pulled from the Jira REST API for every ticket the user visited in the browser.
-- One row per issue key: this is a durable store rather than a request cache, so past days keep
-- rendering their ticket names/labels without hitting Jira again (and without a token configured).
--
-- Multi-value fields (labels, fixVersions, components) are stored comma-joined instead of as JSON
-- because they are surfaced as auto-tag ConditionVariables, and the auto-tag analyzer stringifies
-- the value before comparing — a JSON array would put quotes and brackets in the way of "contains".
--
-- Deliberately not indexed: rows are only ever read by primary key or as a small IN (…) of the
-- ticket keys visited on one day.
CREATE TABLE IF NOT EXISTS jiraIssues (
  "issueKey"      text NOT NULL PRIMARY KEY,
  "summary"       text NOT NULL DEFAULT '',
  "projectKey"    text NOT NULL DEFAULT '',
  "projectName"   text NOT NULL DEFAULT '',
  "labels"        text NOT NULL DEFAULT '',
  "fixVersions"   text NOT NULL DEFAULT '',
  "components"    text NOT NULL DEFAULT '',
  "sprint"        text NOT NULL DEFAULT '',
  "assignee"      text NOT NULL DEFAULT '',
  "reporter"      text NOT NULL DEFAULT '',
  "status"        text NOT NULL DEFAULT '',
  "issueType"     text NOT NULL DEFAULT '',
  "priority"      text NOT NULL DEFAULT '',
  "parentKey"     text NOT NULL DEFAULT '',
  "parentSummary" text NOT NULL DEFAULT '',
  "fetchedAt"     text NOT NULL
);
