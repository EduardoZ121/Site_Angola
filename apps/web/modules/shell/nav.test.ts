import { describe, expect, it } from 'vitest';
import {
  groupNavItems,
  isNavItemActive,
  isNavItemVisible,
  SHELL_NAV_ITEMS,
  visibleNavItems,
} from './nav';

describe('shell nav', () => {
  it('exposes home as always active', () => {
    const home = SHELL_NAV_ITEMS.find((i) => i.id === 'home');
    expect(home?.status).toBe('active');
    expect(home?.href).toBe('/app');
  });

  it('hides admin without admin.panel', () => {
    const admin = SHELL_NAV_ITEMS.find((i) => i.id === 'admin')!;
    expect(isNavItemVisible(admin, ['platform.access'], 'administrator')).toBe(false);
    expect(isNavItemVisible(admin, ['platform.access', 'admin.panel'], 'administrator')).toBe(true);
  });

  it('gates agente behind agent.operate (no longer open to all)', () => {
    const agente = SHELL_NAV_ITEMS.find((i) => i.id === 'agente')!;
    expect(isNavItemVisible(agente, ['platform.access'], 'client')).toBe(false);
    expect(isNavItemVisible(agente, ['platform.access', 'agent.operate'], 'certified_agent')).toBe(
      true,
    );
    expect(isNavItemVisible(agente, ['platform.access', 'agent.operate'], 'client')).toBe(false);
  });

  it('client experience shows confiança and hides patrimónios', () => {
    const items = visibleNavItems(
      ['platform.access', 'housing.explore', 'contracts.manage', 'trust.manage'],
      'client',
    );
    expect(items.some((i) => i.id === 'patrimonios')).toBe(false);
    expect(items.some((i) => i.id === 'confianca')).toBe(true);
    expect(items.some((i) => i.id === 'explorar')).toBe(true);
    expect(items.some((i) => i.id === 'favoritos')).toBe(true);
    expect(items.some((i) => i.id === 'agente')).toBe(false);
    expect(items.some((i) => i.id === 'conta' && i.href === '/app/perfil')).toBe(true);
    expect(items.some((i) => i.id === 'financeiro')).toBe(true);
    expect(items.some((i) => i.id === 'concierge' && i.href === '/app/concierge')).toBe(true);
    expect(items.some((i) => i.id === 'super')).toBe(false);
  });

  it('super admin sees command center', () => {
    const items = visibleNavItems(
      ['platform.access', 'admin.panel', 'finance.manage', 'finance.read'],
      'super_administrator',
    );
    expect(items.some((i) => i.id === 'super' && i.href === '/app/super')).toBe(true);
    expect(items.some((i) => i.id === 'admin')).toBe(true);
  });

  it('partner experience hides explorar / favoritos', () => {
    const items = visibleNavItems(
      ['platform.access', 'properties.manage', 'contracts.manage', 'trust.manage'],
      'patrimonial_partner',
    );
    expect(items.some((i) => i.id === 'patrimonios')).toBe(true);
    expect(items.some((i) => i.id === 'ativar')).toBe(true);
    expect(items.some((i) => i.id === 'explorar')).toBe(false);
    expect(items.some((i) => i.id === 'favoritos')).toBe(false);
  });

  it('client_partner shows both cliente and parceiro groups', () => {
    const items = visibleNavItems(
      [
        'platform.access',
        'housing.explore',
        'properties.manage',
        'contracts.manage',
        'trust.manage',
      ],
      'client_partner',
    );
    const groups = groupNavItems(items);
    expect(groups.some((g) => g.group === 'cliente')).toBe(true);
    expect(groups.some((g) => g.group === 'parceiro')).toBe(true);
    expect(items.some((i) => i.id === 'explorar')).toBe(true);
    expect(items.some((i) => i.id === 'patrimonios')).toBe(true);
  });

  it('marks /app home active only on the home path', () => {
    const home = SHELL_NAV_ITEMS.find((i) => i.id === 'home')!;
    expect(isNavItemActive(home, '/app')).toBe(true);
    expect(isNavItemActive(home, '/app/')).toBe(true);
    expect(isNavItemActive(home, '/app/admin')).toBe(false);
  });

  it('marks patrimonios active under /app/patrimonios', () => {
    const item = SHELL_NAV_ITEMS.find((i) => i.id === 'patrimonios')!;
    expect(isNavItemActive(item, '/app/patrimonios')).toBe(true);
    expect(isNavItemActive(item, '/app/patrimonios/novo')).toBe(true);
  });
});
