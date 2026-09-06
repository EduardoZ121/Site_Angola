import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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

  it('keeps render.yaml static headers in sync with SECURITY_HEADERS', () => {
    // Static export on Render does not run middleware — YAML is the production path.
    const yamlPath = resolve(__dirname, '../../../render.yaml');
    const yaml = readFileSync(yamlPath, 'utf8');
    for (const { key, value } of SECURITY_HEADERS) {
      expect(yaml).toContain(`name: ${key}`);
      expect(yaml).toContain(value);
    }
  });
});
