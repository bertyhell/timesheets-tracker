import type { Database } from 'bun:sqlite';

export type FindOneTagParams = {
	id: string;
}

export type FindOneTagResult = {
	id: string;
	tagNameId: string;
	startedAt: string;
	endedAt: string;
	"tagName.id": string;
	"tagName.title": string;
	"tagName.color": string;
}

export function findOneTag(db: Database, params: FindOneTagParams): FindOneTagResult | null {
	const sql = `
	SELECT
	    tags.id as id,
	    tags.tagNameId as tagNameId,
	    tags.startedAt as startedAt,
	    tags.endedAt as endedAt,
	    tagNames.id as "tagName.id",
	    tagNames.title as "tagName.title",
	    tagNames.color as "tagName.color"
	FROM tags
	LEFT JOIN tagNames ON tagNames.id = tags.tagNameId
	WHERE tags.id = ?
	LIMIT 1
	`
	const res = db.prepare(sql)
		.values(params.id);

	return res.length > 0 ? mapArrayToFindOneTagResult(res[0]) : null;
}

function mapArrayToFindOneTagResult(data: any) {
	const result: FindOneTagResult = {
		id: data[0],
		tagNameId: data[1],
		startedAt: data[2],
		endedAt: data[3],
		"tagName.id": data[4],
		"tagName.title": data[5],
		"tagName.color": data[6]
	}
	return result;
}