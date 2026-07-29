import { chromium, devices, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/opt/cursor/artifacts/landing-validation';
const BASE = 'http://127.0.0.1:3000';

mkdirSync(OUT, { recursive: true });

async function assertLanding(page, label) {
  const findings = [];

  await page.goto(BASE, { waitUntil: 'networkidle' });

  const h1 = page.getByRole('heading', { level: 1 });
  await expect(h1).toHaveCount(1);
  await expect(h1).toHaveText('Património. Confiança. Habitação.');

  const startLinks = page.getByRole('link', { name: 'Começar' });
  if ((await startLinks.count()) < 2) findings.push(`${label}: expected ≥2 Começar CTAs`);
  await expect(page.getByRole('link', { name: 'Explorar' })).toBeVisible();

  for (const name of [
    'Porque a Kuteka é diferente',
    'Como funciona',
    'Descobrir',
    'Confiar',
    'Activar',
  ]) {
    await expect(page.getByRole('heading', { name })).toBeVisible();
  }

  await expect(page.getByText('Não somos um site de anúncios')).toBeVisible();

  await page.getByRole('link', { name: 'Explorar' }).click();
  await expect(page).toHaveURL(/#diferenca/);
  await expect(page.locator('#diferenca')).toBeInViewport();

  await expect(page.getByRole('link', { name: 'Ir para o conteúdo' })).toHaveCount(1);

  await expect(page.getByRole('link', { name: 'Termos de utilização' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Política de privacidade' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contacto' })).toBeVisible();

  const body = (await page.locator('body').innerText()).toLowerCase();
  for (const banned of ['últimas vagas', 'oferta do dia', 'registar grátis', 'classificados']) {
    if (body.includes(banned)) findings.push(`${label}: banned phrase "${banned}"`);
  }

  const color = await h1.evaluate((el) => getComputedStyle(el).color);
  if (!color.includes('255')) {
    findings.push(`${label}: h1 color unexpected: ${color}`);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(OUT, `${label}-hero.png`), fullPage: false });
  await page.screenshot({ path: join(OUT, `${label}-full.png`), fullPage: true });

  // Section screenshots
  await page.locator('#diferenca').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(OUT, `${label}-diferenca.png`), fullPage: false });

  await page.locator('#como-funciona').scrollIntoViewIfNeeded();
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(OUT, `${label}-como-funciona.png`), fullPage: false });

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      load: nav ? Math.round(nav.loadEventEnd) : null,
    };
  });

  // Hero image present and sized
  const heroImg = page.locator('section[aria-labelledby="landing-hero-title"] img').first();
  await expect(heroImg).toBeVisible();
  const natural = await heroImg.evaluate((img) => ({
    w: img.naturalWidth,
    h: img.naturalHeight,
    complete: img.complete,
  }));
  // next/image serves responsive srcset — mobile naturalWidth can be ~viewport width
  if (!natural.complete || natural.w < 300) {
    findings.push(`${label}: hero image incomplete ${JSON.stringify(natural)}`);
  }

  return { findings, metrics, natural };
}

async function main() {
  const browser = await chromium.launch();
  const report = {};

  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    report.desktop = await assertLanding(page, 'desktop');
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 820, height: 1180 } });
    const page = await context.newPage();
    report.tablet = await assertLanding(page, 'tablet');
    await context.close();
  }

  {
    const context = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await context.newPage();
    report.mobile = await assertLanding(page, 'mobile');

    const enterVisible = await page
      .getByRole('banner')
      .getByRole('link', { name: 'Entrar' })
      .isVisible()
      .catch(() => false);
    if (enterVisible) {
      report.mobile.findings.push('mobile: Entrar should be hidden in topbar (PASSO 1 §9.1)');
    }

    // Começar full-width stack in hero
    const heroStart = page
      .locator('section[aria-labelledby="landing-hero-title"]')
      .getByRole('link', { name: 'Começar' });
    const box = await heroStart.boundingBox();
    const vp = page.viewportSize();
    if (box && vp && box.width < vp.width * 0.7) {
      report.mobile.findings.push(
        `mobile: Começar CTA should be near full-width (got ${Math.round(box.width)} / ${vp.width})`,
      );
    }

    await context.close();
  }

  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    report.seo = await page.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      og: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    }));

    // Auth placeholder
    await page.goto(`${BASE}/auth`, { waitUntil: 'domcontentloaded' });
    report.authPlaceholder = await page.getByText('PRD-001').isVisible();
    await context.close();
  }

  await browser.close();

  const allFindings = ['desktop', 'tablet', 'mobile'].flatMap((k) => report[k]?.findings ?? []);
  const summary = { ok: allFindings.length === 0, allFindings, report };
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (allFindings.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
