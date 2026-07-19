import { test, expect } from '@playwright/test';

// These tests mutate the single global "automatic cleanup" setting, so they must not
// interleave with each other (they may still run in parallel with other spec files,
// which don't touch this setting).
test.describe.configure({ mode: 'serial' });

test.describe('General settings', () => {
  test('database section renders the current database path', async ({ page }) => {
    await page.goto('/settings/general');
    // level: 2 disambiguates the page's h2 title from the "Database" h3 sub-section heading.
    await expect(page.getByRole('heading', { name: 'Database', level: 2 })).toBeVisible();
    // "Current path" isn't a <label for>-associated field, so target the readonly input directly.
    await expect(page.locator('input[readonly]')).not.toHaveValue('');
  });

  test('save an automatic cleanup interval and see the computed cutoff date', async ({ page }) => {
    await page.goto('/settings/general');

    const numericInput = page.locator('input[type="number"]');
    const unitSelect = page.locator('select.c-input');

    // The numeric input is disabled while unit === "never" (the default), so the unit
    // must be picked first to enable it.
    await unitSelect.selectOption('months');
    await numericInput.fill('6');

    await expect(page.getByText(/Events started before .* will be deleted\./)).toBeVisible();

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Cleanup setting saved')).toBeVisible();

    await page.reload();
    await expect(page.locator('input[type="number"]')).toHaveValue('6');
    await expect(page.locator('select.c-input')).toHaveValue('months');
  });

  test('clear the automatic cleanup setting', async ({ page }) => {
    await page.goto('/settings/general');

    await page.locator('select.c-input').selectOption('never');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Cleanup setting saved')).toBeVisible();
    await expect(page.getByText('Automatic cleanup is disabled.')).toBeVisible();

    await page.reload();
    await expect(page.locator('select.c-input')).toHaveValue('never');
  });
});
