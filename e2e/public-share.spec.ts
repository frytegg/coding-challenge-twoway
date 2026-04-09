import { test, expect } from '@playwright/test';

test('Public prompt is viewable without auth', async ({ page }) => {
  // a. Navigate to home page (not signed in).
  await page.goto('/');

  // b. Click on the first visible prompt card.
  const firstCard = page.locator('a[href^="/prompts/"]').first();
  await expect(firstCard).toBeVisible();
  const cardTitle = await firstCard.locator('h3').textContent();
  await firstCard.click();

  // c. Verify the prompt detail page loads with title, body content, author name, and tags.
  await expect(page).toHaveURL(/\/prompts\/[a-zA-Z0-9-]+/);
  // The page title h1 is inside the header section (not the prose/markdown body)
  const pageTitle = page.locator('h1.text-3xl');
  await expect(pageTitle).toBeVisible();
  // Body is rendered as markdown inside a .prose container
  await expect(page.locator('.prose')).toBeVisible();
  // Author name is present in the meta row
  const authorName = page.getByText(/Alice Chen|Bob Rivera/).first();
  await expect(authorName).toBeVisible();
  // At least one tag should be visible (all seed prompts have tags)
  const tags = page.locator('.rounded-full.bg-violet-100');
  await expect(tags.first()).toBeVisible();

  // d. Verify the "Copy Prompt" button is visible.
  await expect(page.getByRole('button', { name: 'Copy prompt' })).toBeVisible();

  // e. Verify the URL follows the pattern /prompts/[some-id].
  expect(page.url()).toMatch(/\/prompts\/[a-zA-Z0-9-]+$/);
});

test('Copy button works', async ({ browser }) => {
  // a. Create a context with clipboard permissions granted.
  const context = await browser.newContext({
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  const page = await context.newPage();

  // b. Navigate to a prompt detail page.
  await page.goto('/');
  const firstCard = page.locator('a[href^="/prompts/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/prompts\/[a-zA-Z0-9-]+/);

  // c. Click the Copy button on the detail page.
  const copyButton = page.getByRole('button', { name: 'Copy prompt' });
  await expect(copyButton).toBeVisible();
  await copyButton.click();

  // d. Verify the button text changes to indicate success ("Copied!").
  await expect(page.getByText('Copied!')).toBeVisible();

  await context.close();
});
