/**
 * A Jira issue key is a project key (uppercase letters/digits/underscore, starting with a letter)
 * followed by a dash and the issue number.
 */
const ISSUE_KEY = '[A-Z][A-Z0-9_]*-\\d+';

const BROWSE_PATH = new RegExp(`/browse/(${ISSUE_KEY})(?:[/?#]|$)`);
// Board, backlog, list and timeline views keep the issue key in the query string instead of the path.
const SELECTED_ISSUE_PARAM = new RegExp(`[?&](?:selectedIssue|issueKey)=(${ISSUE_KEY})(?:&|$)`);
// The newer /jira/... routes put the key in the path: /jira/software/c/projects/ABC/issues/ABC-123
const JIRA_APP_PATH = new RegExp(`/jira/[^?#]*/(${ISSUE_KEY})(?:[/?#]|$)`);
// Jira sets the document title to "[ABC-123] the summary - Jira", which is the last resort when the
// url alone does not name the issue (some views only put the key in the title).
const TITLE_PREFIX = new RegExp(`^\\[(${ISSUE_KEY})]`);

/**
 * Finds the Jira issue key a browser visit was looking at, or null when the page is not a ticket.
 *
 * The url is authoritative and the page title is only consulted as a fallback: a Jira board shows
 * the board name in the title while the url still carries `?selectedIssue=`, so preferring the url
 * keeps a visit attributed to the ticket the user actually had open.
 */
export function extractJiraIssueKey(url: string, title?: string | null): string | null {
  // API traffic from the page itself is not a visit to a ticket.
  if (!url.includes('/rest/')) {
    for (const pattern of [BROWSE_PATH, SELECTED_ISSUE_PARAM, JIRA_APP_PATH]) {
      const match = pattern.exec(url);
      if (match) {
        return match[1];
      }
    }
  }

  const titleMatch = title ? TITLE_PREFIX.exec(title.trim()) : null;
  return titleMatch ? titleMatch[1] : null;
}

/**
 * Whether a visited url belongs to the configured Jira instance. Compared on host only, so it keeps
 * working regardless of which path the user landed on, and a base url the user typed with or
 * without a trailing path still matches.
 */
export function isSameJiraHost(url: string, baseUrl: string): boolean {
  try {
    return new URL(url).host.toLowerCase() === new URL(baseUrl).host.toLowerCase();
  } catch {
    return false;
  }
}
