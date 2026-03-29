import type { Database } from 'bun:sqlite';

export type UpdateWebsiteData = {
	websiteTitle: string | null;
	websiteUrl: string | null;
	startedAt: string;
}

export type UpdateWebsiteParams = {
	id: string;
}

export type UpdateWebsiteResult = {
	changes: number;
}

export function updateWebsite(db: Database, data: UpdateWebsiteData, params: UpdateWebsiteParams): UpdateWebsiteResult {
	const sql = `
	UPDATE websites
	SET
	    websiteTitle = ?,
	    websiteUrl = ?,
	    startedAt = ?
	WHERE id = ?
	`
	return db.prepare(sql)
		.run(data.websiteTitle, data.websiteUrl, data.startedAt, params.id) as UpdateWebsiteResult;
}