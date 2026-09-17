import { describe, expect, it, vi, afterEach } from 'vitest';
import { buildAuthEmailRedirect } from '../services/auth-client';

describe('buildAuthEmailRedirect', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds trailing slash and origin for static export routes', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://kutekalink.com' },
    });
    expect(buildAuthEmailRedirect('/auth/verificar')).toBe(
      'https://kutekalink.com/auth/verificar/',
    );
    expect(buildAuthEmailRedirect('/auth/verificar', '/app')).toBe(
      'https://kutekalink.com/auth/verificar/?next=%2Fapp',
    );
  });
});
