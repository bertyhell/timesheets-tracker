import type { Database } from 'bun:sqlite';

export type FindAllTagNamesBySearchTermParams = {
	param1: string;
}

export type FindAllTagNamesBySearchTermResult = {
	id: string;
	title: string;
	code?: string;
	color: string;
}

export function findAllTagNamesBySearchTerm(db: Database, params: FindAllTagNamesBySearchTermParams): FindAllTagNamesBySearchTermResult[] {
	const sql = `
	SELECT id, title, code, color
	FROM tagNames
	WHERE title like '%' || $searchTerm || '%'
	
	`
	return db.prepare(sql)
		.values(params.param1)
		.map(data => mapArrayToFindAllTagNamesBySearchTermResult(data));
}

function mapArrayToFindAllTagNamesBySearchTermResult(data: any) {
	const result: FindAllTagNamesBySearchTermResult = {
		id: data[0],
		title: data[1],
		code: data[2],
		color: data[3]
	}
	return result;
}