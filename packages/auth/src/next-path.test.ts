import { describe, expect, it } from 'vitest';
import { resolveSafeNextPath } from './next-path';

describe('resolveSafeNextPath', () => {
  it('defaults to /app', () => {
    expect(resolveSafeNextPath(null)).toBe('/app');
    expect(resolveSafeNextPath(undefined)).toBe('/app');
    expect(resolveSafeNextPath('')).toBe('/app');
    expect(resolveSafeNextPath('   ')).toBe('/app');
  });

  it('allows /app and nested app paths', () => {
    expect(resolveSafeNextPath('/app')).toBe('/app');
    expect(resolveSafeNextPath('/app/')).toBe('/app');
    expect(resolveSafeNextPath('/app/settings')).toBe('/app/settings');
  });

  it('rejects absolute, protocol-relative, and traversal', () => {
    expect(resolveSafeNextPath('https://evil.example/phish')).toBe('/app');
    expect(resolveSafeNextPath('http://evil.example')).toBe('/app');
    expect(resolveSafeNextPath('//evil.example/x')).toBe('/app');
    expect(resolveSafeNextPath('/app/../auth')).toBe('/app');
    expect(resolveSafeNextPath('/app/%2e%2e/auth')).toBe('/app');
  });

  it('rejects non-/app paths', () => {
    expect(resolveSafeNextPath('/auth/entrar')).toBe('/app');
    expect(resolveSafeNextPath('/')).toBe('/app');
    expect(resolveSafeNextPath('app')).toBe('/app');
  });

  it('gates /app/admin on admin.panel', () => {
    expect(resolveSafeNextPath('/app/admin')).toBe('/app');
    expect(resolveSafeNextPath('/app/admin', { hasAdminPanel: false })).toBe('/app');
    expect(resolveSafeNextPath('/app/admin', { hasAdminPanel: true })).toBe('/app/admin');
    expect(resolveSafeNextPath('/app/admin/users', { hasAdminPanel: true })).toBe(
      '/app/admin/users',
    );
    expect(resolveSafeNextPath('/app/admin/users', { hasAdminPanel: false })).toBe('/app');
  });
});
