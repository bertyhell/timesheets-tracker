import { test, expect } from '@playwright/test';
import { uniqueName } from '../utils/unique-name';

test.describe('Auto notes management', () => {
  test('create, edit and delete an auto note', async ({ page }, testInfo) => {
    const title = uniqueName('e2e-note', testInfo);
    const updatedTitle = `${title}-updated`;

    await test.step('create an auto note with the default variable', async () => {
      await page.goto('/manage/notes');
      await expect(page.getByRole('heading', { name: 'Auto notes' })).toBeVisible();

      await page.getByRole('button', { name: 'Add auto note' }).click();
      const modal = page.locator('.c-edit-tag-name-modal');
      await expect(modal.getByRole('heading', { name: 'Add note' })).toBeVisible();

      await modal.locator('input.c-input').first().fill(title);
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();
    });

    await test.step('find the created note via search', async () => {
      await page.getByPlaceholder('Search...').fill(title);
      await expect(page.getByRole('cell', { name: title, exact: true })).toBeVisible();
    });

    await test.step('edit the note title', async () => {
      await page.getByRole('row', { name: title }).getByRole('button', { name: 'EDIT' }).click();
      const modal = page.locator('.c-edit-tag-name-modal');
      await expect(modal.getByRole('heading', { name: 'Update note' })).toBeVisible();

      const nameInput = modal.locator('input.c-input').first();
      await expect(nameInput).toHaveValue(title);
      await nameInput.fill(updatedTitle);
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();
    });

    await test.step('verify the update and delete the note', async () => {
      await page.getByPlaceholder('Search...').fill(updatedTitle);
      const row = page.getByRole('row', { name: updatedTitle });
      await expect(row).toBeVisible();

      await row.getByRole('button', { name: 'DELETE' }).click();
      await expect(page.getByRole('row', { name: updatedTitle })).toHaveCount(0);
    });
  });
});
