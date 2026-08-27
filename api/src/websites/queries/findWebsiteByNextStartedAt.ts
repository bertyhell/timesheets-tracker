import type { DatabaseSync } from 'node:sqlite';

export type FindWebsiteByNextStartedAtParams = {
  startedAt: string;
};

export type FindWebsiteByNextStartedAtResult = {
  id: string;
  websiteTitle?: string;
  websiteUrl?: string;
  startedAt: string;
};

export function findWebsiteByNextStartedAt(
  db: DatabaseSync,
  params: FindWebsiteByNextStartedAtParams
): FindWebsiteByNextStartedAtResult | null {
  const sql = `
	SELECT id, websiteTitle, websiteUrl, startedAt
	FROM websites
	WHERE startedAt > ?
	ORDER BY startedAt
	limit 1
	`;
  return (db.prepare(sql).get(params.startedAt) as FindWebsiteByNextStartedAtResult | null) ?? null;
}
