import { expect, test } from '@playwright/test';

test('landing hero communicates positioning', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Património. Confiança. Habitação.',
  );
  await expect(page.getByRole('link', { name: 'Começar' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explorar' })).toBeVisible();
  await expect(page.getByText('Kuteka · Angola', { exact: true })).toBeVisible();
});

test('landing difference and how-it-works sections render', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Porque a Kuteka é diferente' })).toBeVisible();
  await expect(page.getByText('Não somos um site de anúncios')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Como funciona' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Descobrir' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Confiar' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Activar' })).toBeVisible();
});

test('explorar scrolls to difference section', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explorar' }).click();
  await expect(page).toHaveURL(/#diferenca/);
  await expect(page.locator('#diferenca')).toBeInViewport();
});

test('health endpoint returns ok', async ({ request }) => {
  const res = await request.get('/api/health');
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.status).toBe('ok');
});

test('comecar leads to auth placeholder', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('link', { name: 'Começar' }).click();
  await expect(page).toHaveURL(/\/auth/);
  await expect(page.getByText('PRD-001')).toBeVisible();
});
