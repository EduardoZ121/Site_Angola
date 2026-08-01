import { describe, expect, it } from 'vitest';
import {
  availableExperiences,
  canAccessPath,
  defaultExperience,
  permissionsForExperience,
  resolveExperience,
} from './role-experience';

describe('role experience', () => {
  it('offers client_partner when both roles exist', () => {
    const modes = availableExperiences(['client', 'patrimonial_partner']);
    expect(modes).toContain('client_partner');
    expect(modes).toContain('client');
    expect(modes).toContain('patrimonial_partner');
    expect(defaultExperience(['client', 'patrimonial_partner'])).toBe('client_partner');
  });

  it('defaults to partner when only partner', () => {
    expect(defaultExperience(['patrimonial_partner'])).toBe('patrimonial_partner');
  });

  it('intersects lens with real permissions (no escalation)', () => {
    const effective = permissionsForExperience('client', [
      'platform.access',
      'housing.explore',
      'properties.manage',
      'contracts.manage',
    ]);
    expect(effective).toContain('housing.explore');
    expect(effective).not.toContain('properties.manage');
  });

  it('blocks patrimónios path in client lens', () => {
    const effective = permissionsForExperience('client', [
      'platform.access',
      'housing.explore',
      'properties.manage',
    ]);
    const access = canAccessPath('/app/patrimonios/novo', effective);
    expect(access.ok).toBe(false);
  });

  it('allows patrimónios in partner lens when real permission exists', () => {
    const effective = permissionsForExperience('patrimonial_partner', [
      'platform.access',
      'properties.manage',
    ]);
    expect(canAccessPath('/app/patrimonios', effective).ok).toBe(true);
  });

  it('resolves stored preference when still available', () => {
    expect(resolveExperience(['client', 'patrimonial_partner'], 'client')).toBe('client');
    expect(resolveExperience(['client'], 'patrimonial_partner')).toBe('client');
  });
});
