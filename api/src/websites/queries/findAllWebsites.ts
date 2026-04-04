import type { Database } from 'bun:sqlite';

export type FindAllWebsitesParams = {
	startedAt: string;
	endedAt: string;
}

export type FindAllWebsitesResult = {
	id: string;
	websiteTitle?: string;
	websiteUrl?: string;
	startedAt: string;
}

export function findAllWebsites(db: Database, params: FindAllWebsitesParams): FindAllWebsitesResult[] {
	const sql = `
	SELECT id, websiteTitle, websiteUrl, startedAt
	FROM (
	    SELECT *, ROW_NUMBER() OVER (PARTITION BY startedAt ORDER BY id) as rn
	    FROM websites
	    WHERE startedAt > ? AND startedAt < ?
	)
	WHERE rn = 1
	`
	return db.prepare(sql)
		.values(params.startedAt, params.endedAt)
		.map(data => mapArrayToFindAllWebsitesResult(data));
}

function mapArrayToFindAllWebsitesResult(data: any) {
	const result: FindAllWebsitesResult = {
		id: data[0],
		websiteTitle: data[1],
		websiteUrl: data[2],
		startedAt: data[3]
	}
	return result;
}