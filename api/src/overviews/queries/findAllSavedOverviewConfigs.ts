import type { DatabaseSync } from 'node:sqlite';

export type FindAllSavedOverviewConfigsResult = {
  id: string;
  name: string;
  visualOrder: number;
  dateRangeMode: string;
  customStartedAt?: string;
  customEndedAt?: string;
  sourceTypes: string;
  pivotState: string;
  createdAt: string;
  updatedAt: string;
};

export function findAllSavedOverviewConfigs(db: DatabaseSync): FindAllSavedOverviewConfigsResult[] {
  const sql = `
	SELECT id, name, visualOrder, dateRangeMode, customStartedAt, customEndedAt, sourceTypes, pivotState, createdAt, updatedAt
	FROM savedOverviewConfigs
	ORDER BY visualOrder ASC, createdAt ASC
	`;
  return db.prepare(sql).all() as unknown as FindAllSavedOverviewConfigsResult[];
}
