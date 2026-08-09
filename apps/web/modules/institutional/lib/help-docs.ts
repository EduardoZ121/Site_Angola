import { readPublicDoc } from './read-public-doc';

export type HelpDocs = {
  /** Legacy short manual alias (points to complete user manual v2). */
  manual: string;
  /** Full end-user manual (Cliente / PP / Agente / Prestador). */
  manualUtilizador: string;
  /** Ops & governance manual (Supervisor → Founder). */
  manualOperacional: string;
  /** Role × permission × governance matrices. */
  matrizGovernanca: string;
  faq: string;
  glossario: string;
  novidades: string;
  estado: string;
};

/**
 * Load every markdown source for the Kuteka Documentation Center.
 * Canonical sources live in `docs/help/*.md` and are mirrored to `public/docs`.
 * Server-only (uses fs via readPublicDoc).
 */
export function loadHelpDocs(): HelpDocs {
  return {
    manual: readPublicDoc('MANUAL_UTILIZADOR_COMPLETO_v2.md'),
    manualUtilizador: readPublicDoc('MANUAL_UTILIZADOR_COMPLETO_v2.md'),
    manualOperacional: readPublicDoc('MANUAL_OPERACIONAL_ADMINISTRATIVO_v2.md'),
    matrizGovernanca: readPublicDoc('MATRIZ_PAPEIS_PERMISSOES_GOVERNANCA_v2.md'),
    faq: readPublicDoc('FAQ_v1.md'),
    glossario: readPublicDoc('GLOSSARIO_v1.md'),
    novidades: readPublicDoc('NOVIDADES_v1.md'),
    estado: readPublicDoc('ESTADO_SERVICOS_v1.md'),
  };
}

export type { HelpRoleSlug } from './help-role';
export { HELP_ROLE_SLUGS, helpFocusForRole, isHelpRoleSlug } from './help-role';
