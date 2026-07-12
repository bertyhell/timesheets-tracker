import type { DatabaseSync } from 'node:sqlite';

export type DeleteSavedOverviewConfigParams = {
  id: string;
};

export type DeleteSavedOverviewConfigResult = {
  changes: number;
};

export function deleteSavedOverviewConfig(
  db: DatabaseSync,
  params: DeleteSavedOverviewConfigParams
): DeleteSavedOverviewConfigResult {
  const sql = `
	DELETE FROM savedOverviewConfigs
	WHERE id = ?
	`;
  return db.prepare(sql).run(params.id) as DeleteSavedOverviewConfigResult;
}
