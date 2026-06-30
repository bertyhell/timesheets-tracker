import type { DatabaseSync } from 'node:sqlite';

export type FindOverlappingTagsParams = {
  startedAt: string;
  endedAt: string;
};

export type FindOverlappingTagsResult = {
  id: string;
  tagNameId: string;
  startedAt: string;
  endedAt: string;
};

export function findOverlappingTags(
  db: DatabaseSync,
  params: FindOverlappingTagsParams
): FindOverlappingTagsResult[] {
  const sql = `
	SELECT id, tagNameId, startedAt, endedAt
	FROM tags
	WHERE startedAt < ? AND endedAt > ?
	`;
  return db
    .prepare(sql)
    .all(params.endedAt, params.startedAt)
    .map((row: any) => ({
      id: row.id,
      tagNameId: row.tagNameId,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
    }));
}
