import { test, expect, type Page } from '@playwright/test';
import { uniqueName } from '../utils/unique-name';

// Native activity tracking is disabled for e2e (DISABLE_ACTIVITY_TRACKING=true), so no
// program/website/activeState rows are ever captured organically. Tests that need a
// "captured activity" event to tag seed it directly via the same REST endpoint the real
// window listener would call (see api/src/programs/programs.controller.ts).
async function seedProgramEvent(
  page: Page,
  programName: string,
  startedAt: Date,
  endedAt: Date
) {
  const response = await page.request.post('/api/programs', {
    data: {
      programName,
      // Distinct from programName so the "Program" and "Title" columns don't both match
      // the same locator (EventsTable renders one cell per column).
      windowTitle: `${programName}-window`,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
    },
  });
  expect(response.ok()).toBeTruthy();
}

function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

// Right-click context menu items are plain buttons inside .c-context-menu; scope to that
// container instead of a bare getByText so we never collide with same-labelled page buttons
// (e.g. the top-level "Create tag" button).
function contextMenuItem(page: Page, label: string) {
  return page.locator('.c-context-menu').getByRole('button', { name: label, exact: true });
}

// The events list (EventsTable, aria-label "Timeline events") and the totals panel
// (EventsTotalsTable, aria-label "Timeline event totals") both render next to each other and
// can both contain a row/cell for the same program — scope row/cell lookups to the former.
function eventsTable(page: Page) {
  return page.getByRole('table', { name: 'Timeline events' });
}

// Selects a timeline lane by its exact label — a plain substring filter would also match
// "Auto Tags" when looking for "Tags", so anchor the regex to the full string.
function timelineLabel(page: Page, exactTitle: string) {
  const escaped = exactTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.locator('.c-timeline__label', { hasText: new RegExp(`^${escaped}$`) });
}

test.describe('Timelines and events page', () => {
  test('loads the main layout', async ({ page }) => {
    await page.goto('/timelines-and-events');
    await expect(page.getByRole('heading', { name: 'Timeline & Events' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create tag' })).toBeVisible();
  });

  test('create a tag from the top-level Create tag button', async ({ page }, testInfo) => {
    const tagTitle = uniqueName('e2e-tag', testInfo);
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 60_000);

    await page.goto('/timelines-and-events');
    await page.getByRole('button', { name: 'Create tag' }).click();

    const modal = page.locator('.c-edit-tag-modal');
    await expect(modal.getByRole('heading', { name: 'Create tag' })).toBeVisible();

    const tagSelectInput = modal.locator('.c-tag-input input');
    await tagSelectInput.click();
    await tagSelectInput.fill(tagTitle);
    await page.getByRole('option', { name: tagTitle, exact: true }).click();

    const datetimeInputs = modal.locator('input[type="datetime-local"]');
    await datetimeInputs.nth(0).fill(toDatetimeLocal(start));
    await datetimeInputs.nth(1).fill(toDatetimeLocal(end));

    await modal.getByRole('button', { name: 'Save' }).click();
    await expect(modal).not.toBeVisible();

    await timelineLabel(page, 'Tags').click();
    await expect(eventsTable(page).getByRole('cell', { name: tagTitle, exact: true })).toBeVisible();
  });

  test('create, edit and delete a tag from a seeded program event', async ({ page }, testInfo) => {
    const programName = uniqueName('e2e-program', testInfo);
    const tagTitle = uniqueName('e2e-tag-from-event', testInfo);
    const now = new Date();
    const start = new Date(now.getTime() - 60 * 60_000);
    const end = new Date(now.getTime() - 30 * 60_000);

    await seedProgramEvent(page, programName, start, end);

    await page.goto('/timelines-and-events');
    // "Programs" is selected by default on load.
    await expect(eventsTable(page).getByRole('cell', { name: programName, exact: true })).toBeVisible();

    await eventsTable(page)
      .getByRole('row', { name: programName })
      .click({ button: 'right' });
    await contextMenuItem(page, 'Create tag').click();

    const createModal = page.locator('.c-edit-tag-modal');
    await expect(createModal.getByRole('heading', { name: 'Create tag' })).toBeVisible();
    const tagSelectInput = createModal.locator('.c-tag-input input');
    await tagSelectInput.click();
    await tagSelectInput.fill(tagTitle);
    await page.getByRole('option', { name: tagTitle, exact: true }).click();
    await createModal.getByRole('button', { name: 'Save' }).click();
    await expect(createModal).not.toBeVisible();

    await timelineLabel(page, 'Tags').click();
    const tagRow = eventsTable(page).getByRole('row', { name: tagTitle });
    await expect(tagRow).toBeVisible();

    await tagRow.click({ button: 'right' });
    await contextMenuItem(page, 'Edit tag').click();
    const editModal = page.locator('.c-edit-tag-modal');
    await expect(editModal.getByRole('heading', { name: 'Edit tag' })).toBeVisible();
    const note = uniqueName('e2e-note-on-tag', testInfo);
    await editModal.locator('textarea.c-input').fill(note);
    await editModal.getByRole('button', { name: 'Save' }).click();
    await expect(editModal).not.toBeVisible();

    await eventsTable(page).getByRole('row', { name: tagTitle }).click({ button: 'right' });
    await contextMenuItem(page, 'Delete tag').click();
    await expect(eventsTable(page).getByRole('row', { name: tagTitle })).toHaveCount(0);
  });

  test('bulk-tag multiple seeded program events', async ({ page }, testInfo) => {
    const programName = uniqueName('e2e-bulk-program', testInfo);
    const tagTitle = uniqueName('e2e-bulk-tag', testInfo);
    const now = new Date();

    const event1Name = `${programName}-1`;
    const event2Name = `${programName}-2`;
    await seedProgramEvent(
      page,
      event1Name,
      new Date(now.getTime() - 3 * 60 * 60_000),
      new Date(now.getTime() - 2.5 * 60 * 60_000)
    );
    await seedProgramEvent(
      page,
      event2Name,
      new Date(now.getTime() - 2 * 60 * 60_000),
      new Date(now.getTime() - 1.5 * 60 * 60_000)
    );
    // Bulk-tagging picks a pre-existing tag name rather than creating a new one inline:
    // BulkTagModal's Save only checks selectedTagName?.id, and a freshly created option from
    // the async-creatable select has no id yet (unlike EditTagModal, it doesn't create the
    // tag name itself on save), so "create new" silently no-ops there.
    const tagNameResponse = await page.request.post('/api/tag-names', {
      data: { title: tagTitle, code: '', color: '#3366ff' },
    });
    expect(tagNameResponse.ok()).toBeTruthy();

    await page.goto('/timelines-and-events');
    // Filter to just these two events via the global search bar, so the shift-click range
    // select below can't accidentally sweep up unrelated rows seeded by other parallel tests.
    await page.getByPlaceholder('Search events...').fill(programName);

    const row1 = eventsTable(page).getByRole('row', { name: event1Name });
    const row2 = eventsTable(page).getByRole('row', { name: event2Name });
    await expect(row1).toBeVisible();
    await expect(row2).toBeVisible();

    await row1.click();
    await row2.click({ modifiers: ['Shift'] });
    await row2.click({ button: 'right' });

    await contextMenuItem(page, 'Add tag to 2 events').click();

    const bulkModal = page.locator('.c-bulk-tag-modal');
    await expect(bulkModal.getByRole('heading', { name: 'Add tag to events' })).toBeVisible();
    await expect(bulkModal.getByText('2 events selected')).toBeVisible();

    const tagSelectInput = bulkModal.locator('.c-tag-input input');
    await tagSelectInput.click();
    await tagSelectInput.fill(tagTitle);
    await page.getByRole('option', { name: tagTitle, exact: true }).click();

    await bulkModal.getByRole('button', { name: 'Save' }).click();
    await expect(bulkModal).not.toBeVisible();

    // Re-point the global search filter at the tag name — it's still set to programName from
    // the row-selection step above, which wouldn't match anything in the Tags lane.
    await page.getByPlaceholder('Search events...').fill(tagTitle);
    await timelineLabel(page, 'Tags').click();
    await expect(eventsTable(page).getByRole('cell', { name: tagTitle, exact: true }).first()).toBeVisible();
  });
});
