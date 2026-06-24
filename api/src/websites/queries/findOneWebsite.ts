import type { DatabaseSync } from 'node:sqlite';

export type FindOneWebsiteParams = {
	id: string;
}

export type FindOneWebsiteResult = {
	id: string;
	websiteTitle?: string;
	websiteUrl?: string;
	startedAt: string;
}

export function findOneWebsite(db: DatabaseSync, params: FindOneWebsiteParams): FindOneWebsiteResult | null {
	const sql = `
	SELECT id, websiteTitle, websiteUrl, startedAt
	FROM websites
	WHERE id = ?
	LIMIT 1
	`
	return db.prepare(sql).get(params.id) as FindOneWebsiteResult | null ?? null;
}
