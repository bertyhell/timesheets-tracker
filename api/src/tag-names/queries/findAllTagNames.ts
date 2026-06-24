import type { DatabaseSync } from 'node:sqlite';

export type FindAllTagNamesResult = {
	id: string;
	title: string;
	code?: string;
	color: string;
}

export function findAllTagNames(db: DatabaseSync): FindAllTagNamesResult[] {
	const sql = `
	SELECT id, title, code, color
	FROM tagNames
	`
	return db.prepare(sql)
		.all()
		.map(data => mapArrayToFindAllTagNamesResult(data));
}

function mapArrayToFindAllTagNamesResult(data: any) {
	const result: FindAllTagNamesResult = {
		id: data.id,
		title: data.title,
		code: data.code,
		color: data.color
	}
	return result;
}