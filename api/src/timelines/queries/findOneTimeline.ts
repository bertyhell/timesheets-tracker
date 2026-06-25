import type { DatabaseSync } from 'node:sqlite';

export type FindOneTimelineParams = {
  id: string;
};

export type FindOneTimelineResult = {
  id: string;
  title: string;
  timelineType: string;
  eventProviderInfo?: string;
  createdAt: string;
  updatedAt: string;
  visualOrder: number;
};

export function findOneTimeline(
  db: DatabaseSync,
  params: FindOneTimelineParams
): FindOneTimelineResult | null {
  const sql = `
	SELECT
	    id,
	    title,
	    timelineType,
	    eventProviderInfo,
	    createdAt,
	    updatedAt,
	    visualOrder
	FROM timelines
	WHERE id = ?
	LIMIT 1
	`;
  return (db.prepare(sql).get(params.id) as FindOneTimelineResult | null) ?? null;
}
