import type { DatabaseSync } from 'node:sqlite';

export type FindAllTagNamesResult = {
  id: string;
  title: string;
  code?: string;
  color: string;
};

export function findAllTagNames(db: DatabaseSync): FindAllTagNamesResult[] {
  const sql = `
	SELECT tn.id, tn.title, tn.code, tn.color
	FROM tagNames tn
	LEFT JOIN tags t ON t.tagNameId = tn.id
	  AND t.endedAt >= datetime('now', '-14 days')
	GROUP BY tn.id, tn.title, tn.code, tn.color
	ORDER BY
	  CASE WHEN MAX(t.endedAt) IS NOT NULL THEN 0 ELSE 1 END,
	  MAX(t.endedAt) DESC,
	  tn.title ASC
	`;
  return db
    .prepare(sql)
    .all()
    .map((data) => mapArrayToFindAllTagNamesResult(data));
}

function mapArrayToFindAllTagNamesResult(data: any) {
  const result: FindAllTagNamesResult = {
    id: data.id,
    title: data.title,
    code: data.code,
    color: data.color,
  };
  return result;
}
