import type { ExperienceMode } from '@/modules/shell/role-experience';
import type { AppLocale } from './types';

/** Short role name (menu list). */
const ROLE_NAME: Record<AppLocale, Record<ExperienceMode, string>> = {
  pt: {
    client: 'Cliente',
    patrimonial_partner: 'Parceiro Patrimonial',
    client_partner: 'Cliente + Parceiro',
    certified_agent: 'Agente Certificado',
    administrator: 'Administrador',
    super_administrator: 'Superadministrador',
  },
  en: {
    client: 'Client',
    patrimonial_partner: 'Property Partner',
    client_partner: 'Client + Partner',
    certified_agent: 'Certified Agent',
    administrator: 'Administrator',
    super_administrator: 'Super Administrator',
  },
  fr: {
    client: 'Client',
    patrimonial_partner: 'Partenaire Patrimonial',
    client_partner: 'Client + Partenaire',
    certified_agent: 'Agent Certifié',
    administrator: 'Administrateur',
    super_administrator: 'Superadministrateur',
  },
  es: {
    client: 'Cliente',
    patrimonial_partner: 'Socio Patrimonial',
    client_partner: 'Cliente + Socio',
    certified_agent: 'Agente Certificado',
    administrator: 'Administrador',
    super_administrator: 'Superadministrador',
  },
};

/** Clear mode badge for header / sidebar ("Modo Cliente"). */
const MODE_BADGE: Record<AppLocale, Record<ExperienceMode, string>> = {
  pt: {
    client: 'Modo Cliente',
    patrimonial_partner: 'Modo Parceiro Patrimonial',
    client_partner: 'Modo Integrado',
    certified_agent: 'Modo Agente',
    administrator: 'Modo Administrador',
    super_administrator: 'Modo Superadministrador',
  },
  en: {
    client: 'Client Mode',
    patrimonial_partner: 'Property Partner Mode',
    client_partner: 'Integrated Mode',
    certified_agent: 'Agent Mode',
    administrator: 'Administrator Mode',
    super_administrator: 'Super Administrator Mode',
  },
  fr: {
    client: 'Mode Client',
    patrimonial_partner: 'Mode Partenaire Patrimonial',
    client_partner: 'Mode Intégré',
    certified_agent: 'Mode Agent',
    administrator: 'Mode Administrateur',
    super_administrator: 'Mode Superadministrateur',
  },
  es: {
    client: 'Modo Cliente',
    patrimonial_partner: 'Modo Socio Patrimonial',
    client_partner: 'Modo Integrado',
    certified_agent: 'Modo Agente',
    administrator: 'Modo Administrador',
    super_administrator: 'Modo Superadministrador',
  },
};

export function experienceLabel(mode: ExperienceMode, locale: AppLocale = 'pt'): string {
  return ROLE_NAME[locale][mode];
}

export function modeBadgeLabel(mode: ExperienceMode, locale: AppLocale = 'pt'): string {
  return MODE_BADGE[locale][mode];
}
