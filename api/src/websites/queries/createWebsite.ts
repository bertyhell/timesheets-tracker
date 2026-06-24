import type { DatabaseSync } from 'node:sqlite';

export type CreateWebsiteParams = {
	id: string;
	websiteTitle: string | null;
	websiteUrl: string | null;
	startedAt: string;
}

export type CreateWebsiteResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createWebsite(db: DatabaseSync, params: CreateWebsiteParams): CreateWebsiteResult {
	const sql = `
	INSERT INTO websites
	(id, websiteTitle, websiteUrl, startedAt)
	VALUES (?, ?, ?, ?)
	`
	return db.prepare(sql)
		.run(params.id, params.websiteTitle, params.websiteUrl, params.startedAt) as CreateWebsiteResult;
}