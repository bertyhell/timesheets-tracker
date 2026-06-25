import type { DatabaseSync } from 'node:sqlite';

export type FindOneAutoTagParams = {
  id: string;
};

export type FindOneAutoTagResult = {
  id: string;
  title: string;
  tagNameId: string;
  priority: number;
  conditions: string;
  'tagName.id': string;
  'tagName.title': string;
  'tagName.color': string;
};

export function findOneAutoTag(
  db: DatabaseSync,
  params: FindOneAutoTagParams
): FindOneAutoTagResult | null {
  const sql = `
	SELECT
	    autoTags.id,
	    autoTags.title,
	    autoTags.tagNameId,
	    autoTags.priority,
	    autoTags.conditions,
	    tagNames.id as "tagName.id",
	    tagNames.title as "tagName.title",
	    tagNames.color as "tagName.color"
	FROM autoTags
	LEFT JOIN tagNames ON tagNames.id = autoTags.tagNameId
	WHERE autoTags.id = ?
	LIMIT 1
	`;
  return (db.prepare(sql).get(params.id) as FindOneAutoTagResult | null) ?? null;
}
