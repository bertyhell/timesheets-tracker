import { test, expect } from '@playwright/test';
import { uniqueName } from '../utils/unique-name';

/**
 * CI has no JetBrains IDE and therefore no local history to read, so this spec asserts the
 * graceful-degradation contract rather than the events themselves: the lane needs no
 * configuration, it can be created like any other, and a machine with nothing to read renders an
 * empty timeline instead of an error. That is exactly the behaviour that regresses when the
 * parser or the store lookup starts throwing.
 */
test.describe('File edits timeline', () => {
  test('create a file edits timeline and render it without local history', async ({ page }, testInfo) => {
    const title = uniqueName('e2e-file-edits', testInfo);

    await test.step('create a FileEdit timeline', async () => {
      await page.goto('/manage/timelines');
      await expect(page.getByRole('heading', { name: 'Timelines' })).toBeVisible();

      await page.getByRole('button', { name: 'Add timeline' }).click();
      const modal = page.locator('.c-edit-timeline-modal');
      await expect(modal.getByRole('heading', { name: 'Add timeline' })).toBeVisible();

      // Unlike Calendar or GitCommit, this type needs no follow-up field: it reads whatever the
      // IDE recorded, for every project at once.
      await modal.locator('select.c-input').selectOption('FileEdit');
      await modal.locator('input.c-input').nth(0).fill(title);

      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();

      await page.getByPlaceholder('Search...').fill(title);
      await expect(page.getByRole('cell', { name: title, exact: true })).toBeVisible();
    });

    await test.step('the lane renders on the timelines page', async () => {
      await page.goto('/timelines-and-events');
      const label = page.locator('.c-timeline__label', { hasText: new RegExp(`^${title}$`) });
      await expect(label).toBeVisible();
    });

    await test.step('clean up', async () => {
      await page.goto('/manage/timelines');
      await page.getByPlaceholder('Search...').fill(title);
      await page.getByRole('row', { name: title }).getByRole('button', { name: 'DELETE' }).click();
      await expect(page.getByRole('row', { name: title })).toHaveCount(0);
    });
  });
});
