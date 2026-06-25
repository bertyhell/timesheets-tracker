import type { DatabaseSync } from 'node:sqlite';

export type FindOneTagNameParams = {
  id: string;
};

export type FindOneTagNameResult = {
  id: string;
  title: string;
  code?: string;
  color: string;
};

export function findOneTagName(
  db: DatabaseSync,
  params: FindOneTagNameParams
): FindOneTagNameResult | null {
  const sql = `
	SELECT id, title, code, color
	FROM tagNames
	WHERE id = ?
	LIMIT 1
	`;
  return (db.prepare(sql).get(params.id) as FindOneTagNameResult | null) ?? null;
}
