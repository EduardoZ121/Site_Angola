import { describe, expect, it } from 'vitest';
import { operatingProfileFor } from './role-operating-matrix';

describe('role operating matrix', () => {
  it('super admin home prioritizes command center, not partner activate', () => {
    const profile = operatingProfileFor('super_administrator');
    const hrefs = profile.homeCtas.map((c) => c.href);
    expect(hrefs[0]).toBe('/app/super');
    expect(hrefs).toContain('/app/admin');
    expect(hrefs).not.toContain('/app/patrimonios/novo');
    expect(profile.mustNot.some((x) => /Parceiro|património/i.test(x))).toBe(true);
  });

  it('partner home prioritizes activate property', () => {
    const profile = operatingProfileFor('patrimonial_partner');
    expect(profile.homeCtas[0]?.href).toBe('/app/patrimonios/novo');
  });

  it('client home prioritizes explore housing', () => {
    const profile = operatingProfileFor('client');
    expect(profile.homeCtas[0]?.href).toBe('/app/habitacao/explorar');
  });
});
