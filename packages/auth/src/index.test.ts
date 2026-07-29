import { describe, expect, it } from 'vitest';
import { canAccessAdminPanel, userHasPermission, userHasRole } from './index';

describe('RBAC helpers', () => {
  it('detects roles', () => {
    expect(userHasRole(['client', 'patrimonial_partner'], 'client')).toBe(true);
    expect(userHasRole(['client'], 'administrator')).toBe(false);
  });

  it('checks permissions by capability', () => {
    expect(userHasPermission(['client'], 'platform.access')).toBe(true);
    expect(userHasPermission(['client'], 'admin.panel')).toBe(false);
    expect(userHasPermission(['administrator'], 'admin.panel')).toBe(true);
  });

  it('gates admin panel', () => {
    expect(canAccessAdminPanel({ userId: '1', email: null, roles: ['client'] })).toBe(false);
    expect(canAccessAdminPanel({ userId: '1', email: null, roles: ['administrator'] })).toBe(true);
  });
});
