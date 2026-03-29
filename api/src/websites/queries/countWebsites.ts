import type { Database } from 'bun:sqlite';

export type CountWebsitesResult = {
  count: number;
};

export function countWebsites(db: Database): CountWebsitesResult | null {
  const sql = `
	SELECT count(*) as count
	FROM websites
	
	`;
  const res = db.prepare(sql).values();

  return res.length > 0 ? mapArrayToCountWebsitesResult(res[0]) : null;
}

function mapArrayToCountWebsitesResult(data: any) {
  const result: CountWebsitesResult = {
    count: data[0],
  };
  return result;
}
