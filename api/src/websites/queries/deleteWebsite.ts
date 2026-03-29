import type { Database } from 'bun:sqlite';

export type DeleteWebsiteParams = {
  param1: string;
};

export type DeleteWebsiteResult = {
  changes: number;
};

export function deleteWebsite(db: Database, params: DeleteWebsiteParams): DeleteWebsiteResult {
  const sql = `
	DELETE FROM websites
	WHERE id = $id
	
	`;
  return db.prepare(sql).run(params.param1) as DeleteWebsiteResult;
}
