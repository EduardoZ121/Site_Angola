import { describe, expect, it } from 'vitest';
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
});
