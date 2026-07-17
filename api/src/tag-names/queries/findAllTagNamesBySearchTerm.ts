import type { DatabaseSync } from 'node:sqlite';

export type FindAllTagNamesBySearchTermParams = {
  searchTerm: string;
};

export type FindAllTagNamesBySearchTermResult = {
  id: string;
  title: string;
  code?: string;
  color: string;
  note?: string;
};

export function findAllTagNamesBySearchTerm(
  db: DatabaseSync,
  params: FindAllTagNamesBySearchTermParams
): FindAllTagNamesBySearchTermResult[] {
  const sql = `
	SELECT tn.id, tn.title, tn.code, tn.color, tn.note
	FROM tagNames tn
	LEFT JOIN tags t ON t.tagNameId = tn.id
	  AND t.endedAt >= datetime('now', '-14 days')
	WHERE tn.title like '%' || ? || '%'
	GROUP BY tn.id, tn.title, tn.code, tn.color, tn.note
	ORDER BY
	  CASE WHEN MAX(t.endedAt) IS NOT NULL THEN 0 ELSE 1 END,
	  MAX(t.endedAt) DESC,
	  tn.title ASC
	`;
  return db
    .prepare(sql)
    .all(params.searchTerm)
    .map((data) => mapArrayToFindAllTagNamesBySearchTermResult(data));
}

function mapArrayToFindAllTagNamesBySearchTermResult(data: any) {
  const result: FindAllTagNamesBySearchTermResult = {
    id: data.id,
    title: data.title,
    code: data.code,
    color: data.color,
    note: data.note,
  };
  return result;
}
