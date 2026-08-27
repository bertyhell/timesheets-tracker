import type { DatabaseSync } from 'node:sqlite';

export type FindAllWebsitesParams = {
  startedAt: string;
  endedAt: string;
};

export type FindAllWebsitesResult = {
  id: string;
  websiteTitle?: string;
  websiteUrl?: string;
  startedAt: string;
};

export function findAllWebsites(
  db: DatabaseSync,
  params: FindAllWebsitesParams
): FindAllWebsitesResult[] {
  const sql = `
	SELECT id, websiteTitle, websiteUrl, startedAt
	FROM (
	    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY id) as rn
	    FROM websites
	    WHERE startedAt > ? AND startedAt < ?
	)
	WHERE rn = 1
	ORDER BY startedAt
	`;
  return db
    .prepare(sql)
    .all(params.startedAt, params.endedAt)
    .map((data) => mapArrayToFindAllWebsitesResult(data));
}

function mapArrayToFindAllWebsitesResult(data: any) {
  const result: FindAllWebsitesResult = {
    id: data.id,
    websiteTitle: data.websiteTitle,
    websiteUrl: data.websiteUrl,
    startedAt: data.startedAt,
  };
  return result;
}
