import type { Database } from 'bun:sqlite';

export type UpdateWebsiteData = {
	param1: string | null;
	param2: string | null;
	param3: string;
}

export type UpdateWebsiteParams = {
	param1: string;
}

export type UpdateWebsiteResult = {
	changes: number;
}

export function updateWebsite(db: Database, data: UpdateWebsiteData, params: UpdateWebsiteParams): UpdateWebsiteResult {
	const sql = `
	UPDATE websites
	SET
	    websiteTitle = $websiteTitle,
	    websiteUrl = $websiteUrl,
	    startedAt = $startedAt
	WHERE id = $id
	
	`
	return db.prepare(sql)
		.run(data.param1, data.param2, data.param3, params.param1) as UpdateWebsiteResult;
}