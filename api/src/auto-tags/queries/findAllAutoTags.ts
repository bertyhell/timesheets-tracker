import type { Database } from 'bun:sqlite';

export type FindAllAutoTagsResult = {
	id: string;
	title: string;
	tagNameId: string;
	priority: number;
	conditions: string;
	"tagName.id": string;
	"tagName.title": string;
	"tagName.color": string;
}

export function findAllAutoTags(db: Database): FindAllAutoTagsResult[] {
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
	`
	return db.prepare(sql)
		.values()
		.map(data => mapArrayToFindAllAutoTagsResult(data));
}

function mapArrayToFindAllAutoTagsResult(data: any) {
	const result: FindAllAutoTagsResult = {
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