import type { DatabaseSync } from 'node:sqlite';

export type FindIntegrationByTypeResult = {
  type: string;
  baseUrl: string;
  organisationId: string;
  userId: string;
  token: string;
};

export function findIntegrationByType(
  db: DatabaseSync,
  params: { type: string }
): FindIntegrationByTypeResult | undefined {
  const sql = `SELECT type, baseUrl, organisationId, userId, token FROM integrations WHERE type = ?`;
  return db.prepare(sql).get(params.type) as FindIntegrationByTypeResult | undefined;
}
