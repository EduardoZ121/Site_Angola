import { describe, expect, it } from 'vitest';
import { getLandingCopy } from './content';

describe('getLandingCopy(pt)', () => {
  const landingContent = getLandingCopy('pt');

  it('keeps official hero positioning', () => {
    expect(landingContent.hero.title).toBe('Património. Confiança. Habitação.');
    expect(landingContent.difference.pillars).toHaveLength(3);
    expect(landingContent.howItWorks.steps.map((s) => s.title)).toEqual([
      'Descobrir',
      'Confiar',
      'Activar',
    ]);
  });

  it('does not use classifieds language as primary identity', () => {
    const blob = JSON.stringify(landingContent).toLowerCase();
    expect(blob.includes('classificados')).toBe(false);
    expect(landingContent.difference.intro).toContain('Não somos um site de anúncios');
  });
});

describe('getLandingCopy — locale packs stay in their own language', () => {
  it('renders English copy without Portuguese leaking in', () => {
    const en = getLandingCopy('en');
    expect(en.hero.title).toBe('Legacy. Trust. Housing.');
    expect(en.hero.title).not.toContain('Património');
    expect(en.topbar.enter).toBe('Sign in');
    expect(en.difference.pillars).toHaveLength(3);
  });

  it('renders French copy with the official Patrimoine positioning', () => {
    const fr = getLandingCopy('fr');
    expect(fr.hero.title).toBe('Patrimoine. Confiance. Logement.');
    expect(fr.hero.title).not.toContain('Habitação');
    expect(fr.topbar.enter).toBe('Se connecter');
  });

  it('renders Spanish copy without Portuguese leaking in', () => {
    const es = getLandingCopy('es');
    expect(es.hero.title).toBe('Patrimonio. Confianza. Vivienda.');
    expect(es.hero.title).not.toContain('Habitação');
    expect(es.topbar.enter).toBe('Iniciar sesión');
  });

  it('falls back to Portuguese for unknown locales', () => {
    expect(getLandingCopy('xx' as never).hero.title).toBe(getLandingCopy('pt').hero.title);
  });
});
