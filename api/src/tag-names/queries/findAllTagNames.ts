import type { Database } from 'bun:sqlite';

export type FindAllTagNamesResult = {
  id: string;
  title: string;
  code?: string;
  color: string;
};

export function findAllTagNames(db: Database): FindAllTagNamesResult[] {
  const sql = `
	SELECT id, title, code, color
	FROM tagNames
	
	
	
	
	`;
  return db
    .prepare(sql)
    .values()
    .map((data) => mapArrayToFindAllTagNamesResult(data));
}

function mapArrayToFindAllTagNamesResult(data: any) {
  const result: FindAllTagNamesResult = {
    id: data[0],
    title: data[1],
    code: data[2],
    color: data[3],
  };
  return result;
}
