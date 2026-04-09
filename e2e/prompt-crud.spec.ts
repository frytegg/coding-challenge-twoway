import { test, expect } from '@playwright/test';

test('Full CRUD happy path', async ({ page }) => {
  // a. Navigate to home page. Verify at least one prompt card is visible.
  await page.goto('/');
  const cards = page.locator('a[href^="/prompts/"]');
  await expect(cards.first()).toBeVisible();

  // b. Sign in with credentials.
  await page.getByRole('button', { name: 'Sign In' }).click();

  // The sign-in dialog should appear
  await expect(page.getByText('Sign in to PromptVault')).toBeVisible();

  await page.getByPlaceholder('Email').fill('alice@demo.com');
  await page.getByPlaceholder('Password').fill('password123');
  await page.locator('form').getByRole('button', { name: 'Sign In' }).click();

  // c. After sign-in, verify the user avatar or name appears in the navbar.
  // The user menu shows the user's initials in a round avatar div when no image is set
  await expect(page.locator('header').getByText('AC')).toBeVisible({ timeout: 10000 });

  // d. Click "New Prompt" button. Fill in the form.
  await page.getByRole('link', { name: 'New Prompt' }).click();
  await expect(page).toHaveURL('/prompts/new');

  await page.locator('#title').fill('E2E Test Prompt');

  // Fill the markdown editor body — the MDEditor uses a textarea internally
  const editorTextarea = page.locator('.w-md-editor-text-input');
  await editorTextarea.fill('This is a test prompt body with **markdown**.');

  // Add tag "e2e-test" via the tag input
  await page.locator('#tag-input').fill('e2e-test');
  await page.locator('#tag-input').press('Enter');

  // Verify the tag chip appeared
  await expect(page.getByText('e2e-test')).toBeVisible();

  // Submit the form
  await page.getByRole('button', { name: 'Create Prompt' }).click();

  // e. Verify redirect to the new prompt's detail page with the title visible.
  await expect(page.locator('h1.text-3xl')).toHaveText('E2E Test Prompt', { timeout: 10000 });
  await expect(page).toHaveURL(/\/prompts\/.+/);

  // f. Click "Edit" button. Change title. Save.
  await page.getByRole('link', { name: 'Edit' }).click();
  await expect(page).toHaveURL(/\/prompts\/.+\/edit/);

  const titleInput = page.locator('#title');
  await titleInput.clear();
  await titleInput.fill('E2E Test Prompt (Edited)');

  await page.getByRole('button', { name: 'Save Changes' }).click();

  // g. Verify the updated title is displayed.
  await expect(page.locator('h1.text-3xl')).toHaveText('E2E Test Prompt (Edited)', {
    timeout: 10000,
  });

  // h. Click "Delete" button. Confirm deletion.
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('button', { name: 'Confirm Delete' }).click();

  // i. Verify redirect to home page. Verify the prompt is no longer visible.
  await expect(page).toHaveURL('/', { timeout: 10000 });
  await expect(page.getByText('E2E Test Prompt (Edited)')).not.toBeVisible();
});
