import type { ExperienceMode } from '@/modules/shell/role-experience';
import type { AppLocale } from './types';

/** Short role name (menu list). */
const ROLE_NAME: Record<AppLocale, Record<ExperienceMode, string>> = {
  pt: {
    client: 'Cliente',
    patrimonial_partner: 'Parceiro Patrimonial',
    client_partner: 'Cliente + Parceiro',
    certified_agent: 'Agente Certificado',
    service_provider: 'Prestador',
    supervisor: 'Supervisor',
    administrator: 'Administrador',
    super_administrator: 'Superadministrador',
    founder: 'Founder / Owner',
  },
  en: {
    client: 'Client',
    patrimonial_partner: 'Property Partner',
    client_partner: 'Client + Partner',
    certified_agent: 'Certified Agent',
    service_provider: 'Service Provider',
    supervisor: 'Supervisor',
    administrator: 'Administrator',
    super_administrator: 'Super Administrator',
    founder: 'Founder / Owner',
  },
  fr: {
    client: 'Client',
    patrimonial_partner: 'Partenaire Patrimonial',
    client_partner: 'Client + Partenaire',
    certified_agent: 'Agent Certifié',
    service_provider: 'Prestataire',
    supervisor: 'Superviseur',
    administrator: 'Administrateur',
    super_administrator: 'Superadministrateur',
    founder: 'Founder / Owner',
  },
  es: {
    client: 'Cliente',
    patrimonial_partner: 'Socio Patrimonial',
    client_partner: 'Cliente + Socio',
    certified_agent: 'Agente Certificado',
    service_provider: 'Prestador',
    supervisor: 'Supervisor',
    administrator: 'Administrador',
    super_administrator: 'Superadministrador',
    founder: 'Founder / Owner',
  },
};

/** Clear mode badge for header / sidebar ("Modo Cliente"). */
const MODE_BADGE: Record<AppLocale, Record<ExperienceMode, string>> = {
  pt: {
    client: 'Modo Cliente',
    patrimonial_partner: 'Modo Parceiro Patrimonial',
    client_partner: 'Modo Integrado',
    certified_agent: 'Modo Agente',
    service_provider: 'Modo Prestador',
    supervisor: 'Modo Supervisor',
    administrator: 'Modo Administrador',
    super_administrator: 'Modo Superadministrador',
    founder: 'Modo Founder / Owner',
  },
  en: {
    client: 'Client Mode',
    patrimonial_partner: 'Property Partner Mode',
    client_partner: 'Integrated Mode',
    certified_agent: 'Agent Mode',
    service_provider: 'Provider Mode',
    supervisor: 'Supervisor Mode',
    administrator: 'Administrator Mode',
    super_administrator: 'Super Administrator Mode',
    founder: 'Founder / Owner Mode',
  },
  fr: {
    client: 'Mode Client',
    patrimonial_partner: 'Mode Partenaire Patrimonial',
    client_partner: 'Mode Intégré',
    certified_agent: 'Mode Agent',
    service_provider: 'Mode Prestataire',
    supervisor: 'Mode Superviseur',
    administrator: 'Mode Administrateur',
    super_administrator: 'Mode Superadministrateur',
    founder: 'Mode Founder / Owner',
  },
  es: {
    client: 'Modo Cliente',
    patrimonial_partner: 'Modo Socio Patrimonial',
    client_partner: 'Modo Integrado',
    certified_agent: 'Modo Agente',
    service_provider: 'Modo Prestador',
    supervisor: 'Modo Supervisor',
    administrator: 'Modo Administrador',
    super_administrator: 'Modo Superadministrador',
    founder: 'Modo Founder / Owner',
  },
};

export function experienceLabel(mode: ExperienceMode, locale: AppLocale = 'pt'): string {
  return ROLE_NAME[locale][mode];
}

export function modeBadgeLabel(mode: ExperienceMode, locale: AppLocale = 'pt'): string {
  return MODE_BADGE[locale][mode];
}
