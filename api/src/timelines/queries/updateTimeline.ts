import type { DatabaseSync } from 'node:sqlite';

export type UpdateTimelineData = {
  title: string;
  timelineType: string;
  eventProviderInfo: string | null;
  updatedAt: string;
  visualOrder: number;
  color: string | null;
};

export type UpdateTimelineParams = {
  id: string;
};

export type UpdateTimelineResult = {
  changes: number;
};

export function updateTimeline(
  db: DatabaseSync,
  data: UpdateTimelineData,
  params: UpdateTimelineParams
): UpdateTimelineResult {
  const sql = `
	UPDATE timelines
	SET
	    title = ?,
	    timelineType = ?,
	    eventProviderInfo = ?,
	    updatedAt = ?,
	    visualOrder = ?,
	    color = ?
	WHERE id = ?
	`;
  return db
    .prepare(sql)
    .run(
      data.title,
      data.timelineType,
      data.eventProviderInfo,
      data.updatedAt,
      data.visualOrder,
      data.color,
      params.id
    ) as UpdateTimelineResult;
}
