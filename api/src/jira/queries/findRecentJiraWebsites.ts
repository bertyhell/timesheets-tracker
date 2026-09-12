import type { DatabaseSync } from 'node:sqlite';

export type FindRecentJiraWebsitesResult = {
  websiteUrl: string | null;
  websiteTitle: string | null;
};

/**
 * The most recently visited pages on a Jira site. Only a handful are needed — the caller is after
 * one ticket key, and the pages on a Jira site that are not a ticket (the board, the backlog) are
 * few enough that the first ticket is always within the last few dozen visits.
 */
export function findRecentJiraWebsites(
  db: DatabaseSync,
  params: { urlPrefix: string; limit: number }
): FindRecentJiraWebsitesResult[] {
  const sql = `
    SELECT websiteUrl, websiteTitle
    FROM websites
    WHERE websiteUrl LIKE ? || '%'
    ORDER BY startedAt DESC
    LIMIT ?
  `;
  return db.prepare(sql).all(params.urlPrefix, params.limit) as FindRecentJiraWebsitesResult[];
}
