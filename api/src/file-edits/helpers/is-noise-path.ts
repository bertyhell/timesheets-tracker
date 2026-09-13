import * as path from 'path';

/**
 * Directories whose contents are written by tooling rather than by the user. Local History records
 * them because the IDE sees the files change on disk, so without this filter an `npm install` or a
 * test run buries a day's real work under thousands of revisions.
 */
const NOISE_DIRECTORIES = new Set([
  '__generated__',
  '.git',
  '.gradle',
  '.idea',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.terraform',
  '.venv',
  '__pycache__',
  'build',
  'coverage',
  'dist',
  'generated',
  'logs',
  'node_modules',
  'out',
  'playwright-report',
  'sessions',
  'target',
  'test-results',
  'tmp',
  'venv',
  'vendor',
]);

/** Generated or machine-managed files that live alongside real source. */
const NOISE_FILE_PATTERN = /(^\.DS_Store$|\.lock$|\.log$|\.map$|-lock\.json$|\.min\.(js|css)$)/;

export function isNoisePath(filePath: string): boolean {
  const segments = filePath.split(/[/\\]/);

  for (const segment of segments.slice(0, -1)) {
    if (NOISE_DIRECTORIES.has(segment)) return true;
  }

  const fileName = segments[segments.length - 1] ?? '';
  if (NOISE_FILE_PATTERN.test(fileName)) return true;

  // Extension-less paths are almost always directory entries rather than edited files.
  return !path.extname(fileName);
}
