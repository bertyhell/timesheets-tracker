import { test, expect } from '@playwright/test';

// These tests are UI-only: they render and interact with the settings forms without submitting to
// the real Productive or Jira APIs, per the agreed e2e scope.
test.describe('Integrations settings', () => {
  test.beforeEach(async ({ request }) => {
    // Remove any leftover integrations (404 is fine — it just means they weren't there).
    await request.delete('/api/integrations/productive');
    await request.delete('/api/integrations/jira');
  });

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

  test('Jira settings form starts empty and only offers to test once it is filled in', async ({
    page,
  }) => {
    await page.goto('/settings/integrations/jira');
    await expect(page.getByRole('heading', { name: 'Jira' })).toBeVisible();

    await expect(page.getByPlaceholder('https://your-org.atlassian.net')).toHaveValue('');
    await expect(page.getByPlaceholder('you@example.com')).toHaveValue('');
    await expect(page.getByPlaceholder('••••••••')).toHaveValue('');

    // Testing the connection saves first, so it stays disabled until there is something to save.
    // Never actually clicked: that would reach out to a real Jira instance.
    await expect(page.getByRole('button', { name: 'Test connection' })).toBeDisabled();

    await page
      .getByPlaceholder('https://your-org.atlassian.net')
      .fill('https://example.atlassian.net');
    await page.getByPlaceholder('you@example.com').fill('someone@example.com');
    await page.getByPlaceholder('••••••••').fill('fake-token');
    await expect(page.getByRole('button', { name: 'Test connection' })).toBeEnabled();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page).toHaveURL(/\/settings\/integrations$/);
  });

  test('Jira is offered as a timeline type only once the integration exists', async ({
    page,
    request,
  }) => {
    await page.goto('/manage/timelines/create');
    const typeSelect = page.locator('select.c-input');
    await expect(typeSelect).toBeVisible();
    await expect(typeSelect.locator('option', { hasText: 'Jira' })).toHaveCount(0);

    await request.put('/api/integrations/jira', {
      data: {
        baseUrl: 'https://example.atlassian.net',
        organisationId: '',
        userId: 'someone@example.com',
        token: 'fake-token',
      },
    });

    await page.goto('/manage/timelines/create');
    await expect(typeSelect.locator('option', { hasText: 'Jira' })).toHaveCount(1);
  });
});
