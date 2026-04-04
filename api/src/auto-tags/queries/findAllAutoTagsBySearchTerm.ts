import type { Database } from 'bun:sqlite';

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

export function findAllAutoTagsBySearchTerm(db: Database, params: FindAllAutoTagsBySearchTermParams): FindAllAutoTagsBySearchTermResult[] {
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
		.values(params.searchTerm)
		.map(data => mapArrayToFindAllAutoTagsBySearchTermResult(data));
}

function mapArrayToFindAllAutoTagsBySearchTermResult(data: any) {
	const result: FindAllAutoTagsBySearchTermResult = {
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