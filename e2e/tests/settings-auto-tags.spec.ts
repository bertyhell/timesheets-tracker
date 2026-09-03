import { test, expect } from '@playwright/test';

// These tests mutate the single global "auto merge tags" setting, so they must not
// interleave with each other.
test.describe.configure({ mode: 'serial' });

test.describe('Auto tags settings', () => {
  test('the auto merge section renders', async ({ page }) => {
    await page.goto('/settings/auto-tags');
    // level: 2 disambiguates the page's h2 title from the "Auto merge tags" h3 sub-section heading.
    await expect(page.getByRole('heading', { name: 'Auto tags', level: 2 })).toBeVisible();
    await expect(page.getByText('Merge tags that are less than')).toBeVisible();
    await expect(page.getByText('minutes apart')).toBeVisible();
  });

  test('save a merge gap and see it persisted', async ({ page }) => {
    await page.goto('/settings/auto-tags');

    // The setting saves on change; there is no save button.
    await page.locator('select.c-input').selectOption('120');
    await expect(page.getByText('Auto merge setting saved')).toBeVisible();

    await page.reload();
    await expect(page.locator('select.c-input')).toHaveValue('120');
  });

  test('disable merging by selecting 0', async ({ page }) => {
    await page.goto('/settings/auto-tags');

    await page.locator('select.c-input').selectOption('0');
    await expect(page.getByText('Auto merge setting saved')).toBeVisible();

    await page.reload();
    await expect(page.locator('select.c-input')).toHaveValue('0');
  });
});
