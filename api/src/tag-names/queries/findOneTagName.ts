import type { Database } from 'bun:sqlite';

export type FindOneTagNameParams = {
  param1: string;
};

export type FindOneTagNameResult = {
  id: string;
  title: string;
  code?: string;
  color: string;
};

export function findOneTagName(
  db: Database,
  params: FindOneTagNameParams
): FindOneTagNameResult | null {
  const sql = `
	SELECT id, title, code, color
	FROM tagNames
	WHERE id = $id
	LIMIT 1
	
	`;
  const res = db.prepare(sql).values(params.param1);

  return res.length > 0 ? mapArrayToFindOneTagNameResult(res[0]) : null;
}

function mapArrayToFindOneTagNameResult(data: any) {
  const result: FindOneTagNameResult = {
    id: data[0],
    title: data[1],
    code: data[2],
    color: data[3],
  };
  return result;
}
