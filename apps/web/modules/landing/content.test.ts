import { describe, expect, it } from 'vitest';
import { landingContent } from './content';

describe('landingContent', () => {
  it('keeps official hero positioning', () => {
    expect(landingContent.hero.title).toBe('Património. Confiança. Habitação.');
    expect(landingContent.difference.pillars).toHaveLength(3);
    expect(landingContent.howItWorks.steps.map((s) => s.title)).toEqual([
      'Descobrir',
      'Confiar',
      'Activar',
    ]);
  });

  it('does not use classifieds language as primary identity', () => {
    const blob = JSON.stringify(landingContent).toLowerCase();
    expect(blob.includes('classificados')).toBe(false);
    expect(landingContent.difference.intro).toContain('Não somos um site de anúncios');
  });
});
