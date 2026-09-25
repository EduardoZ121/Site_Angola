import { describe, expect, it } from 'vitest';
import {
  availableExperiences,
  canAccessPath,
  defaultExperience,
  homePathForExperience,
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

  it('super admin lens does not expose partner activate (properties.manage)', () => {
    const effective = permissionsForExperience('super_administrator', [
      'platform.access',
      'admin.panel',
      'properties.manage',
      'housing.explore',
      'finance.manage',
      'properties.review',
    ]);
    expect(effective).toContain('finance.manage');
    expect(effective).toContain('properties.review');
    expect(effective).not.toContain('properties.manage');
  });

  it('defaults to founder when founder role is present', () => {
    expect(defaultExperience(['founder', 'super_administrator', 'client'])).toBe('founder');
    expect(availableExperiences(['founder', 'co_founder'])).toContain('founder');
  });

  it('defaults to service_provider ahead of client when both exist', () => {
    expect(defaultExperience(['service_provider', 'client'])).toBe('service_provider');
  });

  it('maps home paths for founder and prestador', () => {
    expect(homePathForExperience('founder')).toBe('/app/fundador');
    expect(homePathForExperience('service_provider')).toBe('/app/servicos');
    expect(homePathForExperience('supervisor')).toBe('/app/admin');
  });

  it('blocks the accountant cockpit without finance read', () => {
    const client = permissionsForExperience('client', [
      'platform.access',
      'housing.explore',
      'finance.read',
    ]);
    expect(canAccessPath('/app/contabilista', client).ok).toBe(false);
    const founder = permissionsForExperience('founder', [
      'platform.access',
      'finance.read',
      'founder.manage',
    ]);
    expect(canAccessPath('/app/contabilista', founder).ok).toBe(true);
  });

  it('sends the accountant home to the cockpit and blocks clients from it', () => {
    expect(homePathForExperience('accountant')).toBe('/app/contabilista');
    const accountant = permissionsForExperience('accountant', [
      'platform.access',
      'finance.read',
      'finance.manage',
    ]);
    expect(accountant).toContain('finance.read');
    expect(accountant).not.toContain('finance.manage');
    expect(canAccessPath('/app/contabilista', accountant).ok).toBe(true);
  });
});
