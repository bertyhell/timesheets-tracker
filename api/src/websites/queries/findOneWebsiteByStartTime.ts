import type { DatabaseSync } from 'node:sqlite';

export type FindOneWebsiteByStartTimeParams = {
	startedAt: string;
}

export type FindOneWebsiteByStartTimeResult = {
	id: string;
	websiteTitle?: string;
	websiteUrl?: string;
	startedAt: string;
}

export function findOneWebsiteByStartTime(db: DatabaseSync, params: FindOneWebsiteByStartTimeParams): FindOneWebsiteByStartTimeResult | null {
	const sql = `
	SELECT id, websiteTitle, websiteUrl, startedAt
	FROM websites
	WHERE startedAt = ?
	LIMIT 1
	`
	return db.prepare(sql).get(params.startedAt) as FindOneWebsiteByStartTimeResult | null ?? null;
}
