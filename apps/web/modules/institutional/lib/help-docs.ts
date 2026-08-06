import { readPublicDoc } from './read-public-doc';

export type HelpDocs = {
  manual: string;
  faq: string;
  glossario: string;
  novidades: string;
  estado: string;
};

/**
 * Load every markdown source for the Kuteka Documentation Center (Centro de
 * Documentação), from the same `public/docs` mirror used by the legal pages.
 * See `docs/help/*.md` for the canonical sources.
 */
export function loadHelpDocs(): HelpDocs {
  return {
    manual: readPublicDoc('MANUAL_UTILIZADOR_v1.md'),
    faq: readPublicDoc('FAQ_v1.md'),
    glossario: readPublicDoc('GLOSSARIO_v1.md'),
    novidades: readPublicDoc('NOVIDADES_v1.md'),
    estado: readPublicDoc('ESTADO_SERVICOS_v1.md'),
  };
}
