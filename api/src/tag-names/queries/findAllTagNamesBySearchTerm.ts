import type { DatabaseSync } from 'node:sqlite';

export type FindAllTagNamesBySearchTermParams = {
  searchTerm: string;
};

export type FindAllTagNamesBySearchTermResult = {
  id: string;
  title: string;
  code?: string;
  color: string;
};

export function findAllTagNamesBySearchTerm(
  db: DatabaseSync,
  params: FindAllTagNamesBySearchTermParams
): FindAllTagNamesBySearchTermResult[] {
  const sql = `
	SELECT id, title, code, color
	FROM tagNames
	WHERE title like '%' || ? || '%'
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
  };
  return result;
}
