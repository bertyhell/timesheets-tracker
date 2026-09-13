import type { DatabaseSync } from 'node:sqlite';

export function deleteOldCachedNetworkRequests(
  db: DatabaseSync,
  params: { before: string }
): { changes: number } {
  // The file-edit day caches are excluded: they are the app's only durable copy of the IDE's
  // local history, which JetBrains itself purges after a few weeks. Expiring them by age would
  // quietly drop days that can no longer be rebuilt from disk.
  const sql = `DELETE FROM cachedNetworkRequests WHERE createdAt < ? AND cacheKey NOT LIKE 'file-edits-%'`;
  return db.prepare(sql).run(params.before) as { changes: number };
}
