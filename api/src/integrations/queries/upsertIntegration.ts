import type { DatabaseSync } from 'node:sqlite';

export type UpsertIntegrationParams = {
  type: string;
  baseUrl: string;
  organisationId: string;
  userId: string;
  token: string;
};

export function upsertIntegration(db: DatabaseSync, params: UpsertIntegrationParams): void {
  const sql = `
    INSERT INTO integrations (type, baseUrl, organisationId, userId, token)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(type) DO UPDATE SET
      baseUrl = excluded.baseUrl,
      organisationId = excluded.organisationId,
      userId = excluded.userId,
      token = excluded.token
  `;
  db.prepare(sql).run(params.type, params.baseUrl, params.organisationId, params.userId, params.token);
}
