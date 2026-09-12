import type { DatabaseSync } from 'node:sqlite';

export type FindJiraIssuesByKeysResult = {
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

export function findJiraIssuesByKeys(
  db: DatabaseSync,
  params: { issueKeys: string[] }
): FindJiraIssuesByKeysResult[] {
  if (!params.issueKeys.length) {
    return [];
  }

  const placeholders = params.issueKeys.map(() => '?').join(', ');
  const sql = `
	SELECT issueKey, summary, projectKey, projectName, labels, fixVersions, components, sprint,
	       assignee, reporter, status, issueType, priority, parentKey, parentSummary, fetchedAt
	FROM jiraIssues
	WHERE issueKey IN (${placeholders})
	`;
  return db.prepare(sql).all(...params.issueKeys) as FindJiraIssuesByKeysResult[];
}
