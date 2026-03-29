import type { Database } from 'bun:sqlite';

export type CountActivitiesResult = {
  count: number;
};

export function countActivities(db: Database): CountActivitiesResult | null {
  const sql = `
	SELECT COUNT(*) as count FROM activities
	
	`;
  const res = db.prepare(sql).values();

  return res.length > 0 ? mapArrayToCountActivitiesResult(res[0]) : null;
}

function mapArrayToCountActivitiesResult(data: any) {
  const result: CountActivitiesResult = {
    count: data[0],
  };
  return result;
}
