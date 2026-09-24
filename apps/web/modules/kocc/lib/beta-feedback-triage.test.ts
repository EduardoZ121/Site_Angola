import { describe, expect, it } from 'vitest';
import { formatBetaPageContextLines } from './beta-feedback-triage';

describe('formatBetaPageContextLines', () => {
  it('labels known keys and drops screenshots', () => {
    expect(
      formatBetaPageContextLines({
        locale: 'pt',
        viewport: '390x844',
        path: '/app/ajuda',
        screenshot: 'data:image/png;base64,abc',
      }),
    ).toEqual([
      { key: 'locale', label: 'Idioma', value: 'pt' },
      { key: 'viewport', label: 'Ecrã', value: '390x844' },
      { key: 'path', label: 'Caminho', value: '/app/ajuda' },
    ]);
  });

  it('returns nothing for empty or blocked-only context', () => {
    expect(formatBetaPageContextLines(null)).toEqual([]);
    expect(formatBetaPageContextLines({ imageBase64: 'xxx' })).toEqual([]);
  });
});
