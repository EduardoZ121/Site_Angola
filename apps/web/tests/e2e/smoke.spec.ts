import { expect, test } from '@playwright/test';

test('home foundation page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Foundation Ready' })).toBeVisible();
  await expect(page.getByText('KUTEKA · KEOS')).toBeVisible();
});

test('health endpoint returns ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
  expect(body.version).toBeTruthy();
});
