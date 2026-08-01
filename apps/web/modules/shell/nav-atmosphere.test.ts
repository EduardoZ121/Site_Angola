import { describe, expect, it } from 'vitest';
import { presetFromPathname } from './media/hero-media';

describe('presetFromPathname', () => {
  it('maps module routes to atmospheres', () => {
    expect(presetFromPathname('/app')).toBe('dashboard');
    expect(presetFromPathname('/app/patrimonios/novo')).toBe('patrimonios');
    expect(presetFromPathname('/app/habitacao/explorar')).toBe('habitacao');
    expect(presetFromPathname('/app/agente')).toBe('agente');
    expect(presetFromPathname('/app/confianca/revisao')).toBe('confianca');
    expect(presetFromPathname('/app/admin/utilizadores')).toBe('admin');
  });
});
