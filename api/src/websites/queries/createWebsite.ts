import type { Database } from 'bun:sqlite';

export type CreateWebsiteParams = {
	param1: string;
	param2: string | null;
	param3: string | null;
	param4: string;
}

export type CreateWebsiteResult = {
	changes: number;
	lastInsertRowid: number;
}

export function createWebsite(db: Database, params: CreateWebsiteParams): CreateWebsiteResult {
	const sql = `
	INSERT INTO websites
	(id, websiteTitle, websiteUrl, startedAt)
	VALUES ($id, $websiteTitle, $websiteUrl, $startedAt)
	
	
	
	`
	return db.prepare(sql)
		.run(params.param1, params.param2, params.param3, params.param4) as CreateWebsiteResult;
}