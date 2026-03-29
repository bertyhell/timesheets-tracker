import type { Database } from 'bun:sqlite';

export type FindOneAutoTagParams = {
	id: string;
}

export type FindOneAutoTagResult = {
	id: string;
	title: string;
	tagNameId: string;
	priority: number;
	conditions: string;
	"tagName.id": string;
	"tagName.title": string;
	"tagName.color": string;
}

export function findOneAutoTag(db: Database, params: FindOneAutoTagParams): FindOneAutoTagResult | null {
	const sql = `
	SELECT
	    autoTags.id,
	    autoTags.title,
	    autoTags.tagNameId,
	    autoTags.priority,
	    autoTags.conditions,
	    tagNames.id as "tagName.id",
	    tagNames.title as "tagName.title",
	    tagNames.color as "tagName.color"
	FROM autoTags
	LEFT JOIN tagNames ON tagNames.id = autoTags.tagNameId
	WHERE autoTags.id = ?
	LIMIT 1
	`
	const res = db.prepare(sql)
		.values(params.id);

	return res.length > 0 ? mapArrayToFindOneAutoTagResult(res[0]) : null;
}

function mapArrayToFindOneAutoTagResult(data: any) {
	const result: FindOneAutoTagResult = {
		id: data[0],
		title: data[1],
		tagNameId: data[2],
		priority: data[3],
		conditions: data[4],
		"tagName.id": data[5],
		"tagName.title": data[6],
		"tagName.color": data[7]
	}
	return result;
}