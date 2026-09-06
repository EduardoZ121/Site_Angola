import { describe, expect, it } from 'vitest';
import { SECURITY_HEADERS, applySecurityHeaders } from './security-headers';

describe('security headers (P0 baseline)', () => {
  it('includes the mandatory browser hardening headers', () => {
    const keys = SECURITY_HEADERS.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Referrer-Policy',
        'Permissions-Policy',
        'Strict-Transport-Security',
        'Content-Security-Policy',
      ]),
    );
  });

  it('applies headers onto a Headers object', () => {
    const headers = new Headers();
    applySecurityHeaders(headers);
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'");
  });
});
