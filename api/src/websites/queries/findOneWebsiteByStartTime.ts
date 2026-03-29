import type { Database } from 'bun:sqlite';

export type FindOneWebsiteByStartTimeParams = {
  param1: string;
};

export type FindOneWebsiteByStartTimeResult = {
  id: string;
  websiteTitle?: string;
  websiteUrl?: string;
  startedAt: string;
};

export function findOneWebsiteByStartTime(
  db: Database,
  params: FindOneWebsiteByStartTimeParams
): FindOneWebsiteByStartTimeResult | null {
  const sql = `
	SELECT id, websiteTitle, websiteUrl, startedAt
	FROM websites
	WHERE startedAt = $startedAt
	LIMIT 1
	
	`;
  const res = db.prepare(sql).values(params.param1);

  return res.length > 0 ? mapArrayToFindOneWebsiteByStartTimeResult(res[0]) : null;
}

function mapArrayToFindOneWebsiteByStartTimeResult(data: any) {
  const result: FindOneWebsiteByStartTimeResult = {
    id: data[0],
    websiteTitle: data[1],
    websiteUrl: data[2],
    startedAt: data[3],
  };
  return result;
}
