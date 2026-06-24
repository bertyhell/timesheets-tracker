import type { DatabaseSync } from 'node:sqlite';

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

export function findAllAutoTags(db: DatabaseSync): FindAllAutoTagsResult[] {
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
		.all()
		.map(data => mapArrayToFindAllAutoTagsResult(data));
}

function mapArrayToFindAllAutoTagsResult(data: any) {
	const result: FindAllAutoTagsResult = {
		id: data.id,
		title: data.title,
		tagNameId: data.tagNameId,
		priority: data.priority,
		conditions: data.conditions,
		"tagName.id": data["tagName.id"],
		"tagName.title": data["tagName.title"],
		"tagName.color": data["tagName.color"]
	}
	return result;
}