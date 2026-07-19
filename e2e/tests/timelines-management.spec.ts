import { test, expect } from '@playwright/test';
import { uniqueName } from '../utils/unique-name';

test.describe('Timelines management', () => {
  test('create, edit and delete a custom calendar timeline', async ({ page }, testInfo) => {
    const title = uniqueName('e2e-timeline', testInfo);
    const updatedTitle = `${title}-updated`;

    await test.step('create a Calendar timeline pointed at the fixture ICS feed', async () => {
      await page.goto('/manage/timelines');
      await expect(page.getByRole('heading', { name: 'Timelines' })).toBeVisible();

      await page.getByRole('button', { name: 'Add timeline' }).click();
      const modal = page.locator('.c-edit-timeline-modal');
      await expect(modal.getByRole('heading', { name: 'Add timeline' })).toBeVisible();

      await modal.locator('select.c-input').selectOption('Calendar');
      await modal.locator('input.c-input').nth(0).fill(title);
      // The 'Calendar ICS link' input only appears once type === 'Calendar'; the exact URL
      // value doesn't matter since CALENDAR_FALLBACK_ICS_FILE substitutes the fixture file.
      await modal.getByPlaceholder('e.g. https://calendar.example.com/feed.ics').fill('https://example.com/fake.ics');

      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();
    });

    await test.step('find the created timeline via search', async () => {
      await page.getByPlaceholder('Search...').fill(title);
      await expect(page.getByRole('cell', { name: title, exact: true })).toBeVisible();
    });

    await test.step('edit the timeline title', async () => {
      await page.getByRole('row', { name: title }).getByRole('button', { name: 'EDIT' }).click();
      const modal = page.locator('.c-edit-timeline-modal');
      await expect(modal.getByRole('heading', { name: 'Update timeline' })).toBeVisible();

      const titleInput = modal.locator('input.c-input').nth(0);
      await expect(titleInput).toHaveValue(title);
      await titleInput.fill(updatedTitle);
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();
    });

    await test.step('verify the update and delete the timeline', async () => {
      await page.getByPlaceholder('Search...').fill(updatedTitle);
      const row = page.getByRole('row', { name: updatedTitle });
      await expect(row).toBeVisible();

      await row.getByRole('button', { name: 'DELETE' }).click();
      await expect(page.getByRole('row', { name: updatedTitle })).toHaveCount(0);
    });
  });
});
