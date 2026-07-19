import type { TestInfo } from '@playwright/test';

/**
 * Tests share one backend + one database for the whole run (see playwright.config.ts),
 * so parallel tests must namespace the entities they create instead of relying on a
 * per-test DB reset. Use this for any tag/timeline/note/etc. name a test creates, and
 * assert against that name rather than against total row counts.
 */
export function uniqueName(prefix: string, testInfo: TestInfo): string {
  return `${prefix}-${testInfo.testId}`;
}
