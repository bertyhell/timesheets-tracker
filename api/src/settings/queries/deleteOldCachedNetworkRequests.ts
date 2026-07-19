import type { DatabaseSync } from 'node:sqlite';

export function deleteOldCachedNetworkRequests(
  db: DatabaseSync,
  params: { before: string }
): { changes: number } {
  const sql = `DELETE FROM cachedNetworkRequests WHERE createdAt < ?`;
  return db.prepare(sql).run(params.before) as { changes: number };
}
