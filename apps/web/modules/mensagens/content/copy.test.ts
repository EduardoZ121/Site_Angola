import { describe, expect, it } from 'vitest';
import {
  getMensagensCopy,
  mensagensCopyEn,
  mensagensCopyEs,
  mensagensCopyFr,
  mensagensCopyPt,
} from './index';

const ALL_LOCALES = [
  ['pt', mensagensCopyPt],
  ['en', mensagensCopyEn],
  ['fr', mensagensCopyFr],
  ['es', mensagensCopyEs],
] as const;

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    acc.push(value);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectStrings(v, acc);
  }
  return acc;
}

describe('mensagens copy', () => {
  it('never surfaces the internal word "Demo" to end users (Beta status hygiene)', () => {
    for (const [, copy] of ALL_LOCALES) {
      const strings = collectStrings(copy);
      for (const text of strings) {
        expect(text.toLowerCase()).not.toContain('demo');
      }
    }
  });

  it('resolves the right locale and falls back to pt for unknown locales', () => {
    expect(getMensagensCopy('en').title).toBe(mensagensCopyEn.title);
    expect(getMensagensCopy('xx-unknown').title).toBe(mensagensCopyPt.title);
  });

  it('keeps the same shape across every locale (no missing translations)', () => {
    const ptKeys = JSON.stringify(Object.keys(flatten(mensagensCopyPt)).sort());
    for (const [, copy] of ALL_LOCALES) {
      expect(JSON.stringify(Object.keys(flatten(copy)).sort())).toBe(ptKeys);
    }
  });
});

function flatten(obj: unknown, prefix = '', acc: Record<string, true> = {}): Record<string, true> {
  if (obj && typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      flatten(value, prefix ? `${prefix}.${key}` : key, acc);
    }
  } else {
    acc[prefix] = true;
  }
  return acc;
}
