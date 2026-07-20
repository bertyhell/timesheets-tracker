import { test, expect } from '@playwright/test';
import { uniqueName } from '../utils/unique-name';

test.describe('Overviews page', () => {
  test('redirects to the first predefined overview and renders it', async ({ page }) => {
    await page.goto('/overviews');
    await expect(page).toHaveURL(/\/overviews\/hours-per-tag-month$/);
    await expect(page.getByRole('heading', { name: 'Overviews' })).toBeVisible();
    await expect(page.locator('.m-overviews-topbar__template .c-dropdown__trigger')).toContainText(
      'Hours per Tag'
    );
  });

  test('create and edit a custom overview config', async ({ page }, testInfo) => {
    const name = uniqueName('e2e-overview', testInfo);
    const updatedName = `${name}-updated`;

    await test.step('create a custom overview', async () => {
      await page.goto('/overviews');
      await page.locator('.m-overviews-topbar__template .c-dropdown__trigger').click();
      await page.getByRole('button', { name: 'New custom overview' }).click();

      const modal = page.locator('.c-edit-overview-config-modal');
      await expect(modal.getByRole('heading', { name: 'New custom overview' })).toBeVisible();
      await modal.locator('input.c-input').fill(name);
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();
      await expect(page).toHaveURL(/\/overviews\/[^/]+$/);
    });

    await test.step('the new overview is selectable from the dropdown', async () => {
      await page.locator('.m-overviews-topbar__template .c-dropdown__trigger').click();
      await expect(
        page.locator('.m-overviews-template-panel__item').filter({ hasText: new RegExp(`^${name}$`) })
      ).toBeVisible();
      await page.keyboard.press('Escape');
    });

    await test.step('edit the overview name', async () => {
      const configId = new URL(page.url()).pathname.split('/').pop();
      await page.goto(`/overviews/${configId}/edit`);

      const modal = page.locator('.c-edit-overview-config-modal');
      await expect(modal.getByRole('heading', { name: 'Edit overview details' })).toBeVisible();
      const nameInput = modal.locator('input.c-input');
      await expect(nameInput).toHaveValue(name);
      await nameInput.fill(updatedName);
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();

      await page.locator('.m-overviews-topbar__template .c-dropdown__trigger').click();
      await expect(
        page.locator('.m-overviews-template-panel__item', { hasText: updatedName })
      ).toBeVisible();
    });
  });
});
