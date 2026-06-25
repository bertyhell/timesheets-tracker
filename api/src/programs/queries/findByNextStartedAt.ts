import type { DatabaseSync } from 'node:sqlite';

export type FindByNextStartedAtParams = {
  startedAt: string;
};

export type FindByNextStartedAtResult = {
  id: string;
  programName?: string;
  windowTitle?: string;
  startedAt: string;
  endedAt: string;
};

export function findByNextStartedAt(
  db: DatabaseSync,
  params: FindByNextStartedAtParams
): FindByNextStartedAtResult | null {
  const sql = `
	SELECT id, programName, windowTitle, startedAt, endedAt
	FROM programs
	WHERE startedAt > ?
	ORDER BY startedAt
	limit 1
	`;
  return (db.prepare(sql).get(params.startedAt) as FindByNextStartedAtResult | null) ?? null;
}
