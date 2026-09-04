import type { DatabaseSync } from 'node:sqlite';

export type FindOneSavedOverviewConfigParams = {
  id: string;
};

export type FindOneSavedOverviewConfigResult = {
  id: string;
  name: string;
  visualOrder: number;
  dateRangeMode: string;
  customStartedAt?: string;
  customEndedAt?: string;
  sourceTypes: string;
  reportState: string;
  createdAt: string;
  updatedAt: string;
};

export function findOneSavedOverviewConfig(
  db: DatabaseSync,
  params: FindOneSavedOverviewConfigParams
): FindOneSavedOverviewConfigResult | null {
  const sql = `
	SELECT id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, reportState, createdAt, updatedAt
	FROM savedOverviewConfigs
	WHERE id = ?
	LIMIT 1
	`;
  return (
    (db.prepare(sql).get(params.id) as FindOneSavedOverviewConfigResult | null) ?? null
  );
}
