import { test, expect } from '@playwright/test';
import { uniqueName } from '../utils/unique-name';

test.describe('Auto tag rules management', () => {
  test('create, edit and delete an auto tag rule', async ({ page }, testInfo) => {
    const tagNameTitle = uniqueName('e2e-autotag-tagname', testInfo);
    const ruleTitle = uniqueName('e2e-autotag-rule', testInfo);
    const updatedRuleTitle = `${ruleTitle}-updated`;

    await test.step('create an auto tag rule with a brand new tag name', async () => {
      await page.goto('/manage/auto-tag-rules');
      await expect(page.getByRole('heading', { name: 'Auto tag rules' })).toBeVisible();

      await page.getByRole('button', { name: 'Add auto tag' }).click();
      const modal = page.locator('.c-edit-auto-tag-modal');
      await expect(modal.getByRole('heading', { name: 'Add auto tag' })).toBeVisible();

      // Fill the rule name FIRST: creating the tag name below is async (a real POST
      // /api/tag-names round trip), and until the rule name field has been touched, the
      // modal auto-copies the newly created tag's title into it — filling the rule name
      // up front avoids a race where that auto-copy clobbers this value.
      const ruleNameInput = modal.locator('input.c-input').first();
      await ruleNameInput.fill(ruleTitle);

      // Create a brand new tag name via the async-creatable tag select (react-select
      // renders its menu in a body-level portal, so the option isn't a modal descendant).
      const tagSelectInput = modal.locator('.c-tag-input input');
      await tagSelectInput.click();
      await tagSelectInput.fill(tagNameTitle);
      await page.getByRole('option', { name: tagNameTitle, exact: true }).click();

      // Fill in one condition: programName contains <ruleTitle>. The operator select
      // already defaults to "contains" for every blank condition row, so it's left alone
      // (clicking it would be ambiguous: every still-blank row shows the same selected value).
      const conditionRow = modal.locator('.c-auto-tag-condition').first();
      await conditionRow.locator('.c-auto-tag-condition__variable-select').click();
      await page.getByText('programName', { exact: true }).click();
      await conditionRow.locator('input.c-auto-tag-condition__value-input').fill(ruleTitle);

      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();
    });

    await test.step('find the created rule via search', async () => {
      await page.getByPlaceholder('Search...').fill(ruleTitle);
      await expect(page.getByRole('cell', { name: ruleTitle, exact: true })).toBeVisible();
    });

    await test.step('edit the rule title', async () => {
      // Unlike the other manage pages, AutoTagsPage's EDIT action is a NavLink (`to=`), not a
      // button, so its accessible role is "link".
      await page.getByRole('row', { name: ruleTitle }).getByRole('link', { name: 'EDIT' }).click();
      const modal = page.locator('.c-edit-auto-tag-modal');
      await expect(modal.getByRole('heading', { name: 'Edit auto tag' })).toBeVisible();

      const ruleNameInput = modal.locator('input.c-input').first();
      await ruleNameInput.fill(updatedRuleTitle);
      await modal.getByRole('button', { name: 'Save' }).click();
      await expect(modal).not.toBeVisible();
    });

    await test.step('verify the update and delete the rule', async () => {
      await page.getByPlaceholder('Search...').fill(updatedRuleTitle);
      const row = page.getByRole('row', { name: updatedRuleTitle });
      await expect(row).toBeVisible();

      await row.getByRole('button', { name: 'DELETE' }).click();
      await expect(page.getByRole('row', { name: updatedRuleTitle })).toHaveCount(0);
    });
  });
});
