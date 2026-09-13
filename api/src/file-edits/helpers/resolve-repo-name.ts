import * as fs from 'fs';
import * as path from 'path';

/**
 * Names the project a file belongs to by walking up to the nearest ancestor holding a `.git`
 * entry, which is what the user thinks of as "the repo".
 *
 * A scan touches tens of thousands of paths but only a few hundred distinct directories, so every
 * lookup along the way is memoised — including the misses, which is what keeps a deep path outside
 * any repository from re-walking its whole ancestry.
 */
export function createRepoNameResolver(): (filePath: string) => string {
  const cache = new Map<string, string | null>();

  function findRepoRoot(directory: string): string | null {
    const cached = cache.get(directory);
    if (cached !== undefined) return cached;

    const parent = path.dirname(directory);
    let result: string | null;

    if (fs.existsSync(path.join(directory, '.git'))) {
      result = directory;
    } else if (parent === directory) {
      // Reached the filesystem root without finding a repository.
      result = null;
    } else {
      result = findRepoRoot(parent);
    }

    cache.set(directory, result);
    return result;
  }

  return (filePath: string): string => {
    const directory = path.dirname(filePath);
    const repoRoot = findRepoRoot(directory);
    // Outside a repository the containing folder is the most useful label available.
    return path.basename(repoRoot ?? directory);
  };
}
