import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface LocalHistoryStore {
  /** Identifies the IDE install the store belongs to, e.g. `WebStorm2026.2`. */
  id: string;
  dataPath: string;
  /** Together with `size`, used as the cache key for a parsed store. */
  mtimeMs: number;
  size: number;
}

/**
 * JetBrains keeps Local History in the IDE's cache directory, one store per installed IDE
 * version. The stores are global rather than per project — they hold absolute paths — so a
 * machine with WebStorm and IntelliJ side by side has two stores that both need reading, and
 * whose contents overlap in time while both versions are in use.
 */
function getJetBrainsCacheRoots(): string[] {
  const home = os.homedir();

  if (process.platform === 'darwin') {
    return [path.join(home, 'Library', 'Caches', 'JetBrains')];
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    return [path.join(localAppData, 'JetBrains')];
  }

  // Linux: the XDG cache dir, which JetBrains has used since 2020.1.
  const xdgCacheHome = process.env.XDG_CACHE_HOME || path.join(home, '.cache');
  return [path.join(xdgCacheHome, 'JetBrains')];
}

/**
 * Finds every Local History store on this machine. Having no JetBrains IDE installed is a normal
 * state rather than an error, so a missing cache root yields an empty list and the timeline
 * simply renders empty.
 */
export function findLocalHistoryStores(): LocalHistoryStore[] {
  const stores: LocalHistoryStore[] = [];

  for (const root of getJetBrainsCacheRoots()) {
    let ideDirectories: string[];
    try {
      ideDirectories = fs.readdirSync(root);
    } catch {
      // Cache root does not exist: no JetBrains IDE installed.
      continue;
    }

    for (const ideDirectory of ideDirectories) {
      const dataPath = path.join(root, ideDirectory, 'LocalHistory', 'changes.storageData');
      try {
        const stats = fs.statSync(dataPath);
        if (!stats.isFile() || stats.size === 0) continue;
        stores.push({
          id: ideDirectory,
          dataPath,
          mtimeMs: stats.mtimeMs,
          size: stats.size,
        });
      } catch {
        // This IDE version has no local history (feature disabled, or never opened a project).
      }
    }
  }

  return stores;
}
