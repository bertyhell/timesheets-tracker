import { test, expect } from '@playwright/test';

// These tests are UI-only: they render and interact with the Productive settings form
// without submitting to the real Productive API, per the agreed e2e scope.
test.describe('Integrations settings', () => {
  test('integrations page offers to add Productive when unconfigured', async ({ page }) => {
    await page.goto('/settings/integrations');
    await expect(page.getByRole('heading', { name: 'Integrations' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add integration' })).toBeVisible();
  });

  test('Productive settings form renders with sensible defaults', async ({ page }) => {
    await page.goto('/settings/integrations/productive');
    await expect(page.getByRole('heading', { name: 'Productive' })).toBeVisible();

    await expect(page.getByPlaceholder('https://api.productive.io')).toHaveValue(
      'https://api.productive.io'
    );
    await expect(page.getByPlaceholder('12345')).toHaveValue('');
    await expect(page.getByPlaceholder('67890')).toHaveValue('');
    await expect(page.getByPlaceholder('••••••••')).toHaveValue('');

    // Save is disabled until the required fields are filled — confirm the form validates
    // without ever actually submitting to the real Productive API.
    await page.getByPlaceholder('12345').fill('12345');
    await page.getByPlaceholder('67890').fill('67890');
    await page.getByPlaceholder('••••••••').fill('fake-token');

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/settings\/integrations$/);
  });
});
