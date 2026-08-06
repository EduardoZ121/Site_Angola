import { describe, expect, it } from 'vitest';
import { KOCC_OPERATIONAL_STATUSES, adminStatusLabel, publicStatusLabel } from './status-labels';
import { inventoryBadge, publicModuleBadge } from './public-label';

describe('KOCC status labels', () => {
  it('never exposes the word "Demo" for any known operational status', () => {
    for (const status of KOCC_OPERATIONAL_STATUSES) {
      expect(publicStatusLabel(status).toLowerCase()).not.toContain('demo');
      expect(publicModuleBadge(status).toLowerCase()).not.toContain('demo');
    }
  });

  it('never exposes internal jargon like "disabled" or "admin" publicly', () => {
    expect(publicStatusLabel('disabled').toLowerCase()).not.toContain('disabl');
    expect(publicStatusLabel('disabled').toLowerCase()).not.toContain('desactiv');
    expect(publicStatusLabel('admin_only').toLowerCase()).not.toContain('admin');
  });

  it('maps known statuses to the expected public pt labels', () => {
    expect(publicStatusLabel('beta_public')).toBe('Beta');
    expect(publicStatusLabel('beta_private')).toBe('Acesso antecipado');
    expect(publicStatusLabel('invite_only')).toBe('Acesso antecipado');
    expect(publicStatusLabel('commercial_active')).toBe('Comercial activo');
    expect(publicStatusLabel('maintenance')).toBe('Em manutenção');
  });

  it('falls back to the beta_public label for unknown/empty status', () => {
    expect(publicStatusLabel(undefined)).toBe('Beta');
    expect(publicStatusLabel(null)).toBe('Beta');
    expect(publicStatusLabel('some_unknown_status')).toBe('Beta');
  });

  it('admin labels are literal and only meant for the Super Admin panel', () => {
    expect(adminStatusLabel('admin_only')).toBe('Apenas administração');
    expect(adminStatusLabel('disabled')).toBe('Desactivado');
    expect(adminStatusLabel('unknown_xyz')).toBe('unknown_xyz');
  });

  it('inventoryBadge never returns "Demo" and is null for non-demo rows', () => {
    expect(inventoryBadge(false)).toBeNull();
    expect(inventoryBadge(null)).toBeNull();
    expect(inventoryBadge(undefined)).toBeNull();
    const badge = inventoryBadge(true);
    expect(badge).not.toBeNull();
    expect((badge ?? '').toLowerCase()).not.toContain('demo');
    expect(badge).toBe('Beta');
  });
});
