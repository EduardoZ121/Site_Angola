/** Client-safe helpers for role-scoped documentation navigation. */

export type HelpRoleSlug =
  'cliente' | 'parceiro' | 'agente' | 'prestador' | 'supervisor' | 'admin' | 'super' | 'founder';

export const HELP_ROLE_SLUGS: readonly HelpRoleSlug[] = [
  'cliente',
  'parceiro',
  'agente',
  'prestador',
  'supervisor',
  'admin',
  'super',
  'founder',
] as const;

export function isHelpRoleSlug(value: string | null | undefined): value is HelpRoleSlug {
  return !!value && (HELP_ROLE_SLUGS as readonly string[]).includes(value);
}

/** Default documentation section + heading anchors for role-scoped help. */
export function helpFocusForRole(role: HelpRoleSlug): {
  section: 'manualUtilizador' | 'manualOperacional' | 'matrizGovernanca';
  headingHint: string;
} {
  // Anchors must match HelpCenterClient slugify() of the H2 titles in the manuals.
  switch (role) {
    case 'cliente':
      return { section: 'manualUtilizador', headingHint: '5-ficha-completa-cliente' };
    case 'parceiro':
      return {
        section: 'manualUtilizador',
        headingHint: '6-ficha-completa-parceiro-patrimonial',
      };
    case 'agente':
      return {
        section: 'manualUtilizador',
        headingHint: '7-ficha-completa-agente-certificado-hub-seccoes-demo-parcial',
      };
    case 'prestador':
      return { section: 'manualUtilizador', headingHint: '8-ficha-completa-prestador' };
    case 'supervisor':
      return { section: 'manualOperacional', headingHint: '5-ficha-completa-supervisor' };
    case 'admin':
      return { section: 'manualOperacional', headingHint: '6-ficha-completa-administrador' };
    case 'super':
      return {
        section: 'manualOperacional',
        headingHint: '7-ficha-completa-superadministrador',
      };
    case 'founder':
      return {
        section: 'manualOperacional',
        headingHint: '8-ficha-completa-founder-owner-ui-claim-real-em-producao-no-snap',
      };
  }
}
