import type { DatabaseSync } from 'node:sqlite';

export type FindAllAutoTagsBySearchTermParams = {
	searchTerm: string;
}

export type FindAllAutoTagsBySearchTermResult = {
	id: string;
	title: string;
	tagNameId: string;
	priority: number;
	conditions: string;
	"tagName.id": string;
	"tagName.title": string;
	"tagName.color": string;
}

export function findAllAutoTagsBySearchTerm(db: DatabaseSync, params: FindAllAutoTagsBySearchTermParams): FindAllAutoTagsBySearchTermResult[] {
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
	WHERE autoTags.title like '%' || ? || '%'
	`
	return db.prepare(sql)
		.all(params.searchTerm)
		.map(data => mapArrayToFindAllAutoTagsBySearchTermResult(data));
}

function mapArrayToFindAllAutoTagsBySearchTermResult(data: any) {
	const result: FindAllAutoTagsBySearchTermResult = {
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