import { describe, expect, it } from 'vitest';
import { getAuthCopy } from '../authentication/content';
import { getOpsCopy } from '../ops/content';
import { experienceLabel, modeBadgeLabel } from './experience-labels';
import { isAppLocale, normalizeLocale } from './types';

describe('locale', () => {
  it('normalizes locale codes', () => {
    expect(normalizeLocale('en-US')).toBe('en');
    expect(normalizeLocale('fr')).toBe('fr');
    expect(normalizeLocale('xx')).toBe('pt');
    expect(isAppLocale('es')).toBe(true);
  });

  it('exposes mode badges per locale', () => {
    expect(modeBadgeLabel('client', 'pt')).toBe('Modo Cliente');
    expect(modeBadgeLabel('client_partner', 'pt')).toBe('Modo Integrado');
    expect(modeBadgeLabel('patrimonial_partner', 'en')).toContain('Partner');
    expect(experienceLabel('client', 'fr')).toBe('Client');
  });

  it('localizes home and ops cockpits', () => {
    expect(getAuthCopy('en').app.welcome).toBe('Welcome');
    expect(getAuthCopy('fr').app.quickExploreHousing).toContain('Explorer');
    expect(getAuthCopy('es').app.welcome).toBe('Bienvenido');
    expect(getOpsCopy('en').client.title).toContain('Housing');
    expect(getOpsCopy('en').client.paymentsPaid).toBe('Payments made');
    expect(getOpsCopy('fr').client.paymentsPaid).toContain('Paiements');
    expect(getOpsCopy('es').client.title).toContain('vivienda');
  });

  it('does not mix Portuguese into French auth chrome', () => {
    const fr = getAuthCopy('fr');
    expect(fr.login.submit).toBe('Se connecter');
    expect(fr.app.loadError).toContain('Réessayez');
    expect(fr.app.loadError).not.toContain('Estamos a ter');
    expect(fr.app.loginRequired).toContain('connecter');
    expect(fr.common.sessionExpired).not.toMatch(/A sua sessão/);
    expect(fr.verify.otpSubmit).toContain('Confirmer');
  });

  it('keeps English login distinct from Portuguese', () => {
    expect(getAuthCopy('en').login.submit).toBe('Sign in');
    expect(getAuthCopy('pt').login.submit).toBe('Entrar');
  });
});
