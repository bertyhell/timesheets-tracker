import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { test, expect } from '@playwright/test';

// This spec swaps out the ONE shared backend's active database file, which every other
// test in the run depends on. It's routed to its own Playwright project
// ('chromium-db-switch') that depends on the default 'chromium' project finishing first,
// so it never runs concurrently with anything else (see playwright.config.ts).
test.describe.configure({ mode: 'serial' });

test.describe('Database settings — switch and move', () => {
  test('switch to a different database file and back', async ({ page }) => {
    await page.goto('/settings/general');

    // The path loads asynchronously (React Query), so wait for it before reading it —
    // a plain .inputValue() can catch it mid-load while it's still empty.
    const pathInput = page.locator('input[readonly]');
    await expect(pathInput).not.toHaveValue('');
    const originalPath = await pathInput.inputValue();

    const switchTarget = path.join(os.tmpdir(), `timesheets-e2e-switch-${process.pid}.sqlite3`);
    fs.writeFileSync(switchTarget, '');

    await page.getByRole('button', { name: 'Switch' }).click();
    const switchModal = page.locator('.c-switch-database-modal');
    await expect(switchModal.getByRole('heading', { name: 'Switch database' })).toBeVisible();
    await switchModal.getByPlaceholder('Path to existing .sqlite3 file').fill(switchTarget);
    await switchModal.getByRole('button', { name: 'Switch' }).click();
    await expect(page.getByText('Database switched successfully')).toBeVisible();
    await expect(switchModal).not.toBeVisible();
    await expect(page.locator('input[readonly]')).toHaveValue(switchTarget);

    // Restore the original database so a locally re-run dev server is left in its
    // starting state (harmless no-op in CI, where the whole temp DB dir is thrown away).
    await page.getByRole('button', { name: 'Switch' }).click();
    await switchModal.getByPlaceholder('Path to existing .sqlite3 file').fill(originalPath);
    await switchModal.getByRole('button', { name: 'Switch' }).click();
    await expect(page.getByText('Database switched successfully')).toBeVisible();
    await expect(page.locator('input[readonly]')).toHaveValue(originalPath);
  });

  test('move the database to a new location', async ({ page }) => {
    await page.goto('/settings/general');

    const pathInput = page.locator('input[readonly]');
    await expect(pathInput).not.toHaveValue('');
    const originalPath = await pathInput.inputValue();
    const moveTarget = path.join(os.tmpdir(), `timesheets-e2e-moved-${process.pid}.sqlite3`);

    await page.getByRole('button', { name: 'Move' }).click();
    const moveModal = page.locator('.c-move-database-modal');
    await expect(moveModal.getByRole('heading', { name: 'Move database' })).toBeVisible();
    await moveModal.getByPlaceholder('Destination path for the database file').fill(moveTarget);
    await moveModal.getByRole('button', { name: 'Move' }).click();
    await expect(page.getByText('Database moved successfully')).toBeVisible();
    await expect(moveModal).not.toBeVisible();
    await expect(page.locator('input[readonly]')).toHaveValue(moveTarget);
    expect(fs.existsSync(moveTarget)).toBeTruthy();

    // Move it back so the app ends the run pointed at its original file.
    await page.getByRole('button', { name: 'Move' }).click();
    await moveModal.getByPlaceholder('Destination path for the database file').fill(originalPath);
    await moveModal.getByRole('button', { name: 'Move' }).click();
    await expect(page.getByText('Database moved successfully')).toBeVisible();
  });
});
