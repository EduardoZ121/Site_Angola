import { describe, expect, it } from 'vitest';
import {
  canAccessAdminPanel,
  canAccessPlatform,
  emptyAuthorizationContext,
  userHasAnyPermission,
  userHasPermission,
  userHasRole,
  type AuthorizationContext,
} from './index';

/** Fixtures simulate DB-resolved permissions — not a parallel product matrix. */
function ctx(
  partial: Partial<AuthorizationContext> & Pick<AuthorizationContext, 'permissions' | 'roles'>,
): AuthorizationContext {
  return {
    userId: 'user-1',
    email: 'a@b.c',
    ...partial,
  };
}

describe('RBAC helpers (DB-resolved permissions)', () => {
  it('detects roles from resolved role list', () => {
    expect(userHasRole(['client', 'patrimonial_partner'], 'client')).toBe(true);
    expect(userHasRole(['client'], 'administrator')).toBe(false);
  });

  it('checks capabilities from resolved permission list', () => {
    expect(userHasPermission(['platform.access'], 'platform.access')).toBe(true);
    expect(userHasPermission(['platform.access'], 'admin.panel')).toBe(false);
    expect(userHasPermission(['platform.access', 'admin.panel'], 'admin.panel')).toBe(true);
  });

  it('supports multi-role union of permissions', () => {
    // Simulates client + administrator assignments resolved by get_user_permission_codes
    const permissions = ['platform.access', 'admin.panel'] as const;
    expect(userHasAnyPermission(permissions, ['admin.panel'])).toBe(true);
    expect(
      canAccessAdminPanel(
        ctx({ roles: ['client', 'administrator'], permissions: [...permissions] }),
      ),
    ).toBe(true);
  });

  it('gates platform and admin panel from context', () => {
    expect(canAccessPlatform(null)).toBe(false);
    expect(canAccessPlatform(emptyAuthorizationContext('x'))).toBe(false);
    expect(canAccessPlatform(ctx({ roles: ['client'], permissions: ['platform.access'] }))).toBe(
      true,
    );
    expect(canAccessAdminPanel(ctx({ roles: ['client'], permissions: ['platform.access'] }))).toBe(
      false,
    );
    expect(
      canAccessAdminPanel(
        ctx({ roles: ['administrator'], permissions: ['platform.access', 'admin.panel'] }),
      ),
    ).toBe(true);
  });
});
