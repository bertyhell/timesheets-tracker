import type { DatabaseSync } from 'node:sqlite';

export type FindAllTagsParams = {
  startedAt: string;
  endedAt: string;
};

export type FindAllTagsResult = {
  id: string;
  tagNameId: string;
  startedAt: string;
  endedAt: string;
  'tagName.id'?: string;
  'tagName.title'?: string;
  'tagName.color'?: string;
};

export function findAllTags(db: DatabaseSync, params: FindAllTagsParams): FindAllTagsResult[] {
  const sql = `
	SELECT
	    tags.id as id,
	    tags.tagNameId as tagNameId,
	    tags.startedAt as startedAt,
	    tags.endedAt as endedAt,
	    tagNames.id as "tagName.id",
	    tagNames.title as "tagName.title",
	    tagNames.color as "tagName.color"
	FROM (
	    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY (julianday(endedAt) - julianday(startedAt)) DESC) as rn
	    FROM tags
	    WHERE startedAt > ? AND endedAt < ?
	) tags
	LEFT JOIN tagNames ON tagNames.id = tags.tagNameId
	WHERE tags.rn = 1
	`;
  return db
    .prepare(sql)
    .all(params.startedAt, params.endedAt)
    .map((data) => mapArrayToFindAllTagsResult(data));
}

function mapArrayToFindAllTagsResult(data: any) {
  const result: FindAllTagsResult = {
    id: data.id,
    tagNameId: data.tagNameId,
    startedAt: data.startedAt,
    endedAt: data.endedAt,
    'tagName.id': data['tagName.id'],
    'tagName.title': data['tagName.title'],
    'tagName.color': data['tagName.color'],
  };
  return result;
}
