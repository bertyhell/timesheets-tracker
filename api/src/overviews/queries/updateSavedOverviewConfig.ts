import type { DatabaseSync } from 'node:sqlite';

export type UpdateSavedOverviewConfigData = {
  name: string;
  dateRangeMode: string;
  customStartedAt: string | null;
  customEndedAt: string | null;
  sourceTypes: string;
  pivotState: string;
  updatedAt: string;
};

export type UpdateSavedOverviewConfigParams = {
  id: string;
};

export type UpdateSavedOverviewConfigResult = {
  changes: number;
};

export function updateSavedOverviewConfig(
  db: DatabaseSync,
  data: UpdateSavedOverviewConfigData,
  params: UpdateSavedOverviewConfigParams
): UpdateSavedOverviewConfigResult {
  const sql = `
	UPDATE savedOverviewConfigs
	SET
	    name = ?,
	    dateRangeMode = ?,
	    customStartedAt = ?,
	    customEndedAt = ?,
	    sourceTypes = ?,
	    pivotState = ?,
	    updatedAt = ?
	WHERE id = ?
	`;
  return db
    .prepare(sql)
    .run(
      data.name,
      data.dateRangeMode,
      data.customStartedAt,
      data.customEndedAt,
      data.sourceTypes,
      data.pivotState,
      data.updatedAt,
      params.id
    ) as UpdateSavedOverviewConfigResult;
}
