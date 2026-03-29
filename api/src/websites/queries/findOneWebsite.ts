import type { Database } from 'bun:sqlite';

export type FindOneWebsiteParams = {
  param1: string;
};

export type FindOneWebsiteResult = {
  id: string;
  websiteTitle?: string;
  websiteUrl?: string;
  startedAt: string;
};

export function findOneWebsite(
  db: Database,
  params: FindOneWebsiteParams
): FindOneWebsiteResult | null {
  const sql = `
	SELECT id, websiteTitle, websiteUrl, startedAt
	FROM websites
	WHERE id = $id
	LIMIT 1
	
	`;
  const res = db.prepare(sql).values(params.param1);

  return res.length > 0 ? mapArrayToFindOneWebsiteResult(res[0]) : null;
}

function mapArrayToFindOneWebsiteResult(data: any) {
  const result: FindOneWebsiteResult = {
    id: data[0],
    websiteTitle: data[1],
    websiteUrl: data[2],
    startedAt: data[3],
  };
  return result;
}
