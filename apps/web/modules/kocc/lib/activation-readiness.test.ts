import { describe, expect, it } from 'vitest';
import { FOUNDER_ACTIVATION_HOLDS, adviseFlag, adviceLabel } from './activation-readiness';

describe('activation readiness', () => {
  it('keeps Kuteka Pay visible as sandbox and does not call it ready for real money', () => {
    const on = adviseFlag('kuteka_pay', true);
    expect(on.risk).toBe('critico');
    expect(on.advice).toBe('AGUARDAR');
    expect(on.readiness).toBeLessThan(70);
    expect(on.confirmToEnable).toBe(true);
    expect(on.blockers.join(' ')).toMatch(/sandbox/i);
    expect(on.blockers.join(' ')).toMatch(/dinheiro real/i);
  });

  it('lets an ordinary Beta module stay on without a confirmation gate', () => {
    const home = adviseFlag('find_home', true);
    expect(home.advice).toBe('ACTIVAR');
    expect(home.confirmToEnable).toBe(false);
    expect(home.readiness).toBeGreaterThan(80);
  });

  it('asks to wait before turning a prepared SMS flag on', () => {
    const sms = adviseFlag('security.sms_otp', false);
    expect(sms.advice).toBe('AGUARDAR');
    expect(sms.confirmToEnable).toBe(true);
  });

  it('lists holds that must not become a second switch', () => {
    const keys = FOUNDER_ACTIVATION_HOLDS.map((item) => item.key);
    expect(keys).toEqual(['pay_real', 'growth_engine', 'delegation', 'agt', 'company_code']);
    expect(FOUNDER_ACTIVATION_HOLDS.find((item) => item.key === 'pay_real')?.advice).toBe(
      'NAO_ACTIVAR',
    );
    expect(adviceLabel('NAO_ACTIVAR')).toBe('Não activar');
  });
});
