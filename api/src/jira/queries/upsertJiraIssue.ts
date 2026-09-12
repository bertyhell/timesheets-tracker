import type { DatabaseSync } from 'node:sqlite';

export type UpsertJiraIssueParams = {
  issueKey: string;
  summary: string;
  projectKey: string;
  projectName: string;
  labels: string;
  fixVersions: string;
  components: string;
  sprint: string;
  assignee: string;
  reporter: string;
  status: string;
  issueType: string;
  priority: string;
  parentKey: string;
  parentSummary: string;
  fetchedAt: string;
};

export function upsertJiraIssue(db: DatabaseSync, params: UpsertJiraIssueParams): void {
  const sql = `
    INSERT INTO jiraIssues (
      issueKey, summary, projectKey, projectName, labels, fixVersions, components, sprint,
      assignee, reporter, status, issueType, priority, parentKey, parentSummary, fetchedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(issueKey) DO UPDATE SET
      summary = excluded.summary,
      projectKey = excluded.projectKey,
      projectName = excluded.projectName,
      labels = excluded.labels,
      fixVersions = excluded.fixVersions,
      components = excluded.components,
      sprint = excluded.sprint,
      assignee = excluded.assignee,
      reporter = excluded.reporter,
      status = excluded.status,
      issueType = excluded.issueType,
      priority = excluded.priority,
      parentKey = excluded.parentKey,
      parentSummary = excluded.parentSummary,
      fetchedAt = excluded.fetchedAt
  `;
  db.prepare(sql).run(
    params.issueKey,
    params.summary,
    params.projectKey,
    params.projectName,
    params.labels,
    params.fixVersions,
    params.components,
    params.sprint,
    params.assignee,
    params.reporter,
    params.status,
    params.issueType,
    params.priority,
    params.parentKey,
    params.parentSummary,
    params.fetchedAt
  );
}
