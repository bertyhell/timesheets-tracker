import type { Database } from 'bun:sqlite';

export type FindAllTagsParams = {
	startedAt: string;
	endedAt: string;
}

export type FindAllTagsResult = {
	id: string;
	tagNameId: string;
	startedAt: string;
	endedAt: string;
	"tagName.id": string;
	"tagName.title": string;
	"tagName.color": string;
}

export function findAllTags(db: Database, params: FindAllTagsParams): FindAllTagsResult[] {
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
	WHERE startedAt > ? AND endedAt < ?
	`
	return db.prepare(sql)
		.values(params.startedAt, params.endedAt)
		.map(data => mapArrayToFindAllTagsResult(data));
}

function mapArrayToFindAllTagsResult(data: any) {
	const result: FindAllTagsResult = {
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