import { Injectable } from '@nestjs/common';

import { DatabaseService } from './database.service';

/**
 * The one way to read and write `cachedNetworkRequests`.
 *
 * Every provider on the `/timelines/events` path caches its remote calls here rather than in
 * memory, so a restart of the api or the Electron client does not throw the work away. Before this
 * existed each service hand-rolled the same three statements, which is how the calendar fetch ended
 * up on a `Map` that only survived until the next restart.
 */
@Injectable()
export class CachedNetworkRequestsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Returns the cached value, or null when there is no entry. `ttlSeconds` treats an older row as a
   * miss; the age check runs in SQL so it compares against the same UTC clock that `createdAt`'s
   * `datetime('now')` default was written with. Without a TTL the entry lives until it is deleted
   * explicitly or purged by age.
   */
  read<T>(cacheKey: string, ttlSeconds?: number): T | null {
    const db = this.databaseService.getDb();
    const row = (
      ttlSeconds === undefined
        ? db
            .prepare('SELECT responseJson FROM cachedNetworkRequests WHERE cacheKey = ?')
            .get(cacheKey)
        : db
            .prepare(
              "SELECT responseJson FROM cachedNetworkRequests WHERE cacheKey = ? AND createdAt > datetime('now', ?)"
            )
            .get(cacheKey, `-${ttlSeconds} seconds`)
    ) as { responseJson: string } | undefined;

    return row ? (JSON.parse(row.responseJson) as T) : null;
  }

  write(cacheKey: string, value: unknown): void {
    this.databaseService
      .getDb()
      .prepare('INSERT OR REPLACE INTO cachedNetworkRequests (cacheKey, responseJson) VALUES (?, ?)')
      .run(cacheKey, JSON.stringify(value));
  }

  delete(cacheKey: string): void {
    this.databaseService
      .getDb()
      .prepare('DELETE FROM cachedNetworkRequests WHERE cacheKey = ?')
      .run(cacheKey);
  }

  /**
   * Drops a group of entries at once, which is what the refresh button in the UI does per provider.
   * `exceptKeysLike` keeps the rows matching a second LIKE pattern, so a versioned key scheme can
   * delete everything it has outgrown without touching the current version.
   */
  deleteByPrefix(prefix: string, exceptKeysLike?: string): void {
    const db = this.databaseService.getDb();
    if (exceptKeysLike === undefined) {
      db.prepare('DELETE FROM cachedNetworkRequests WHERE cacheKey LIKE ?').run(`${prefix}%`);
      return;
    }
    db.prepare(
      'DELETE FROM cachedNetworkRequests WHERE cacheKey LIKE ? AND cacheKey NOT LIKE ?'
    ).run(`${prefix}%`, exceptKeysLike);
  }

  /**
   * Reads `cacheKey`, and on a miss runs `fetcher` and stores what it returns. `clearCache` skips
   * the read but still writes, which is how a refresh in the UI replaces an entry rather than
   * leaving the provider uncached until the next call.
   *
   * Only values that survive a JSON round-trip belong here — cache the response body, not an object
   * graph containing Dates or class instances.
   */
  async cached<T>(
    cacheKey: string,
    fetcher: () => Promise<T>,
    options: { ttlSeconds?: number; clearCache?: boolean } = {}
  ): Promise<T> {
    if (!options.clearCache) {
      const cached = this.read<T>(cacheKey, options.ttlSeconds);
      if (cached !== null) {
        return cached;
      }
    }

    const value = await fetcher();
    this.write(cacheKey, value);
    return value;
  }
}
