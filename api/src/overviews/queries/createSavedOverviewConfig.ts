import type { DatabaseSync } from 'node:sqlite';

export type CreateSavedOverviewConfigParams = {
  id: string;
  name: string;
  visualOrder: number;
  dateRangeMode: string;
  customStartedAt: string | null;
  customEndedAt: string | null;
  sourceTypes: string;
  reportState: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSavedOverviewConfigResult = {
  changes: number;
  lastInsertRowid: number;
};

export function createSavedOverviewConfig(
  db: DatabaseSync,
  params: CreateSavedOverviewConfigParams
): CreateSavedOverviewConfigResult {
  const sql = `
	INSERT INTO savedOverviewConfigs
	(id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, reportState, createdAt, updatedAt)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`;
  return db
    .prepare(sql)
    .run(
      params.id,
      params.name,
      params.visualOrder,
      params.dateRangeMode,
      params.customStartedAt,
      params.customEndedAt,
      params.sourceTypes,
      params.reportState,
      params.createdAt,
      params.updatedAt
    ) as CreateSavedOverviewConfigResult;
}
