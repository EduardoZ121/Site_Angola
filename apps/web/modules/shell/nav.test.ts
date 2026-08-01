import { describe, expect, it } from 'vitest';
import { isNavItemActive, isNavItemVisible, SHELL_NAV_ITEMS } from './nav';

describe('shell nav', () => {
  it('exposes home as the only always-active public item', () => {
    const home = SHELL_NAV_ITEMS.find((i) => i.id === 'home');
    expect(home?.status).toBe('active');
    expect(home?.href).toBe('/app');
  });

  it('hides admin without admin.panel', () => {
    const admin = SHELL_NAV_ITEMS.find((i) => i.id === 'admin')!;
    expect(isNavItemVisible(admin, ['platform.access'])).toBe(false);
    expect(isNavItemVisible(admin, ['platform.access', 'admin.panel'])).toBe(true);
  });

  it('marks /app home active only on the home path', () => {
    const home = SHELL_NAV_ITEMS.find((i) => i.id === 'home')!;
    expect(isNavItemActive(home, '/app')).toBe(true);
    expect(isNavItemActive(home, '/app/')).toBe(true);
    expect(isNavItemActive(home, '/app/admin')).toBe(false);
  });

  it('marks patrimonios active under /app/patrimonios', () => {
    const item = SHELL_NAV_ITEMS.find((i) => i.id === 'patrimonios')!;
    expect(item.status).toBe('active');
    expect(isNavItemActive(item, '/app/patrimonios')).toBe(true);
    expect(isNavItemActive(item, '/app/patrimonios/novo')).toBe(true);
    expect(isNavItemActive(item, '/app')).toBe(false);
  });
});
