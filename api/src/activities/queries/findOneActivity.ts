import type { Database } from 'bun:sqlite';

export type FindOneActivityParams = {
  param1: string;
};

export type FindOneActivityResult = {
  id: string;
  programName?: string;
  windowTitle?: string;
  startedAt: string;
  endedAt: string;
};

export function findOneActivity(
  db: Database,
  params: FindOneActivityParams
): FindOneActivityResult | null {
  const sql = `
	SELECT id, programName, windowTitle, startedAt, endedAt
	FROM activities
	WHERE id = $id
	LIMIT 1
	
	`;
  const res = db.prepare(sql).values(params.param1);

  return res.length > 0 ? mapArrayToFindOneActivityResult(res[0]) : null;
}

function mapArrayToFindOneActivityResult(data: any) {
  const result: FindOneActivityResult = {
    id: data[0],
    programName: data[1],
    windowTitle: data[2],
    startedAt: data[3],
    endedAt: data[4],
  };
  return result;
}
