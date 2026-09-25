import { describe, expect, it } from 'vitest';
import { parseDocRead, readingDocsFor, unreadReading } from './role-reading';

describe('role reading', () => {
  it('gives the client the public manuals and not the accountant pack', () => {
    const ids = readingDocsFor('client').map((doc) => doc.id);
    expect(ids).toContain('manual');
    expect(ids).toContain('termos');
    expect(ids).not.toContain('contabilista');
  });

  it('gives the accountant the draft pack', () => {
    expect(readingDocsFor('accountant').some((doc) => doc.id === 'contabilista')).toBe(true);
  });

  it('counts only unmarked documents', () => {
    const ack = { manual: '2026-09-25T00:00:00.000Z' };
    const unread = unreadReading('client', ack);
    expect(unread.some((doc) => doc.id === 'manual')).toBe(false);
    expect(unread.length).toBe(readingDocsFor('client').length - 1);
  });

  it('ignores broken storage', () => {
    expect(parseDocRead('nope')).toEqual({});
    expect(parseDocRead('{"manual":"ok","bad":1}')).toEqual({ manual: 'ok' });
  });
});
