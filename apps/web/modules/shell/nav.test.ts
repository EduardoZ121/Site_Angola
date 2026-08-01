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

  it('gates product modules by permission (agente stays open for demo)', () => {
    const base = ['platform.access'];
    expect(
      isNavItemVisible(
        SHELL_NAV_ITEMS.find((i) => i.id === 'patrimonios')!,
        base,
      ),
    ).toBe(false);
    expect(
      isNavItemVisible(
        SHELL_NAV_ITEMS.find((i) => i.id === 'patrimonios')!,
        [...base, 'properties.manage'],
      ),
    ).toBe(true);
    expect(
      isNavItemVisible(
        SHELL_NAV_ITEMS.find((i) => i.id === 'habitacao')!,
        base,
      ),
    ).toBe(false);
    expect(
      isNavItemVisible(
        SHELL_NAV_ITEMS.find((i) => i.id === 'habitacao')!,
        [...base, 'housing.explore'],
      ),
    ).toBe(true);
    expect(
      isNavItemVisible(
        SHELL_NAV_ITEMS.find((i) => i.id === 'agente')!,
        base,
      ),
    ).toBe(true);
    expect(
      isNavItemVisible(
        SHELL_NAV_ITEMS.find((i) => i.id === 'confianca')!,
        base,
      ),
    ).toBe(false);
    expect(
      isNavItemVisible(
        SHELL_NAV_ITEMS.find((i) => i.id === 'confianca')!,
        [...base, 'trust.manage'],
      ),
    ).toBe(true);
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

  it('marks habitacao active under /app/habitacao', () => {
    const item = SHELL_NAV_ITEMS.find((i) => i.id === 'habitacao')!;
    expect(item.status).toBe('active');
    expect(item.href).toBe('/app/habitacao');
    expect(isNavItemActive(item, '/app/habitacao')).toBe(true);
    expect(isNavItemActive(item, '/app/habitacao/explorar')).toBe(true);
    expect(isNavItemActive(item, '/app')).toBe(false);
  });

  it('marks all product modules active', () => {
    const product = SHELL_NAV_ITEMS.filter((i) =>
      ['patrimonios', 'habitacao', 'agente', 'confianca'].includes(i.id),
    );
    for (const id of ['patrimonios', 'habitacao', 'agente', 'confianca'] as const) {
      expect(product.find((i) => i.id === id)?.status).toBe('active');
    }
    expect(product.find((i) => i.id === 'confianca')?.href).toBe('/app/confianca');
  });

  it('marks confianca active under /app/confianca', () => {
    const item = SHELL_NAV_ITEMS.find((i) => i.id === 'confianca')!;
    expect(isNavItemActive(item, '/app/confianca')).toBe(true);
    expect(isNavItemActive(item, '/app/confianca/submeter')).toBe(true);
    expect(isNavItemActive(item, '/app')).toBe(false);
  });
});
