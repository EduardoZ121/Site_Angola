import { describe, expect, it } from 'vitest';
import { HELP_SECTION_IDS, isHelpSectionId } from './help-sections';
import { sanitizeBetaPagePath } from '@/modules/kocc/lib/beta-feedback-submit';

describe('HELP_SECTION_IDS parity with beta page_path allowlist', () => {
  it('preserves every Help section via sanitizeBetaPagePath', () => {
    for (const sec of HELP_SECTION_IDS) {
      expect(isHelpSectionId(sec)).toBe(true);
      expect(sanitizeBetaPagePath(`/app/ajuda?sec=${sec}`)).toBe(`/app/ajuda?sec=${sec}`);
    }
  });

  it('drops unknown sec values', () => {
    expect(sanitizeBetaPagePath('/app/ajuda?sec=tickets')).toBe('/app/ajuda');
  });
});
