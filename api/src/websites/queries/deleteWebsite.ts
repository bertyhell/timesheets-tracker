import type { Database } from 'bun:sqlite';

export type DeleteWebsiteParams = {
  id: string;
};

export type DeleteWebsiteResult = {
  changes: number;
};

export function deleteWebsite(db: Database, params: DeleteWebsiteParams): DeleteWebsiteResult {
  const sql = `
	DELETE FROM websites
	WHERE id = ?
	
	`;
  return db.prepare(sql).run(params.id) as DeleteWebsiteResult;
}
