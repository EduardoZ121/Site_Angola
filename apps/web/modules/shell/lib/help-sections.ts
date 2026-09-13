/** Canonical Help Center section ids — shared by Help UI + beta page_path allowlist. */
export const HELP_SECTION_IDS = ['manual', 'faq', 'glossario', 'novidades', 'estado'] as const;

export type HelpSectionId = (typeof HELP_SECTION_IDS)[number];

export function isHelpSectionId(value: string | null | undefined): value is HelpSectionId {
  return !!value && (HELP_SECTION_IDS as readonly string[]).includes(value);
}
