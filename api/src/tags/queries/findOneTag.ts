import type { DatabaseSync } from 'node:sqlite';

export type FindOneTagParams = {
  id: string;
};

export type FindOneTagResult = {
  id: string;
  tagNameId: string;
  startedAt: string;
  endedAt: string;
  note: string | null;
  'tagName.id': string;
  'tagName.title': string;
  'tagName.color': string;
};

export function findOneTag(db: DatabaseSync, params: FindOneTagParams): FindOneTagResult | null {
  const sql = `
	SELECT
	    tags.id as id,
	    tags.tagNameId as tagNameId,
	    tags.startedAt as startedAt,
	    tags.endedAt as endedAt,
	    tags.note as note,
	    tagNames.id as "tagName.id",
	    tagNames.title as "tagName.title",
	    tagNames.color as "tagName.color"
	FROM tags
	LEFT JOIN tagNames ON tagNames.id = tags.tagNameId
	WHERE tags.id = ?
	LIMIT 1
	`;
  return (db.prepare(sql).get(params.id) as FindOneTagResult | null) ?? null;
}
