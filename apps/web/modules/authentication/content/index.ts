import type { AppLocale } from '@/modules/i18n/types';
import { authCopyPt, type AuthCopy } from './pt';

type AppCopy = AuthCopy['app'];

const appEn: AppCopy = {
  title: 'Kuteka dashboard',
  welcome: 'Welcome',
  welcomeAnonymous: 'Welcome to the platform',
  emailLabel: 'Email',
  userFallback: 'Kuteka user',
  active: 'Active account',
  accountStatusTitle: 'Account status',
  accountStatusHint: 'Account ready to use the available modules.',
  accountSummaryAria: 'Account summary',
  dashboardHint: 'The platform is ready — choose an action or open a module.',
  todayTitle: 'What would you like to do today?',
  todayHint: 'Shortcuts to the most used actions in active modules.',
  quickActivateProperty: 'Activate property',
  quickExploreHousing: 'Explore housing',
  quickAgent: 'Agent area',
  quickAdmin: 'Administration',
  quickContracts: 'Contracts',
  quickTrust: 'Verify account',
  quickRoles: 'Manage roles',
  experienceHint: 'Cockpit and flows for this experience — switch role in the account menu.',
  feedPreparing: 'Preparing the continuous environment…',
  rolesLabel: 'Active roles',
  rolesHint: 'The same account can hold several roles.',
  noRoles: 'No active roles yet',
  modulesTitle: 'Platform modules',
  modulesHint: 'Direct access to core platform modules.',
  upcomingTitle: 'Modules',
  moduleAvailable: 'Active',
  moduleUnavailable: 'Soon',
  loadError: 'We are having trouble opening your space. Try again in a moment.',
  stub: 'Use the active modules with the same account and your roles.',
  ctaLanding: 'Back to Landing',
  ctaProfile: 'Profile',
  ctaRoles: 'Manage roles',
  adminTitle: 'Administration',
  adminStub: 'Admin area (admin.panel permission): operations summary, users and Trust review.',
  adminForbidden:
    'You do not have permission for this area (admin.panel). If you think this is an error, contact Kuteka.',
  configMissing:
    'The authenticated area requires Supabase configuration. Set the environment variables and try again.',
};

const appFr: AppCopy = {
  title: 'Tableau de bord Kuteka',
  welcome: 'Bienvenue',
  welcomeAnonymous: 'Bienvenue sur la plateforme',
  emailLabel: 'E-mail',
  userFallback: 'Utilisateur Kuteka',
  active: 'Compte actif',
  accountStatusTitle: 'État du compte',
  accountStatusHint: 'Compte prêt à utiliser les modules disponibles.',
  accountSummaryAria: 'Résumé du compte',
  dashboardHint: 'La plateforme est prête — choisissez une action ou ouvrez un module.',
  todayTitle: 'Que souhaitez-vous faire aujourd’hui ?',
  todayHint: 'Raccourcis vers les actions les plus utilisées.',
  quickActivateProperty: 'Activer un patrimoine',
  quickExploreHousing: 'Explorer le logement',
  quickAgent: 'Espace agent',
  quickAdmin: 'Administration',
  quickContracts: 'Contrats',
  quickTrust: 'Vérifier le compte',
  quickRoles: 'Gérer les rôles',
  experienceHint: 'Cockpit et flux de cette expérience — changez de rôle dans le menu du compte.',
  feedPreparing: 'Préparation de l’environnement continu…',
  rolesLabel: 'Rôles actifs',
  rolesHint: 'Le même compte peut cumuler plusieurs rôles.',
  noRoles: 'Aucun rôle actif pour le moment',
  modulesTitle: 'Modules de la plateforme',
  modulesHint: 'Accès direct aux modules du noyau.',
  upcomingTitle: 'Modules',
  moduleAvailable: 'Actif',
  moduleUnavailable: 'Bientôt',
  loadError: 'Nous avons du mal à ouvrir votre espace. Réessayez dans un instant.',
  stub: 'Utilisez les modules actifs avec le même compte et vos rôles.',
  ctaLanding: 'Retour à la Landing',
  ctaProfile: 'Profil',
  ctaRoles: 'Gérer les rôles',
  adminTitle: 'Administration',
  adminStub:
    'Espace admin (permission admin.panel) : résumé opérationnel, utilisateurs et revue Confiance.',
  adminForbidden:
    'Vous n’avez pas la permission pour cette zone (admin.panel). Si c’est une erreur, contactez Kuteka.',
  configMissing:
    'La zone authentifiée nécessite la configuration Supabase. Définissez les variables d’environnement et réessayez.',
};

const appEs: AppCopy = {
  title: 'Panel Kuteka',
  welcome: 'Bienvenido',
  welcomeAnonymous: 'Bienvenido a la plataforma',
  emailLabel: 'Email',
  userFallback: 'Usuario Kuteka',
  active: 'Cuenta activa',
  accountStatusTitle: 'Estado de la cuenta',
  accountStatusHint: 'Cuenta lista para usar los módulos disponibles.',
  accountSummaryAria: 'Resumen de la cuenta',
  dashboardHint: 'La plataforma está lista — elija una acción o abra un módulo.',
  todayTitle: '¿Qué desea hacer hoy?',
  todayHint: 'Accesos directos a las acciones más usadas.',
  quickActivateProperty: 'Activar patrimonio',
  quickExploreHousing: 'Explorar vivienda',
  quickAgent: 'Área del agente',
  quickAdmin: 'Administración',
  quickContracts: 'Contratos',
  quickTrust: 'Verificar cuenta',
  quickRoles: 'Gestionar roles',
  experienceHint: 'Cockpit y flujos de esta experiencia — cambie de rol en el menú de la cuenta.',
  feedPreparing: 'Preparando el entorno continuo…',
  rolesLabel: 'Roles activos',
  rolesHint: 'La misma cuenta puede tener varios roles.',
  noRoles: 'Aún sin roles activos',
  modulesTitle: 'Módulos de la plataforma',
  modulesHint: 'Acceso directo a los módulos del núcleo.',
  upcomingTitle: 'Módulos',
  moduleAvailable: 'Activo',
  moduleUnavailable: 'Pronto',
  loadError:
    'Estamos teniendo dificultades para abrir su espacio. Inténtelo de nuevo en unos momentos.',
  stub: 'Use los módulos activos con la misma cuenta y sus roles.',
  ctaLanding: 'Volver a la Landing',
  ctaProfile: 'Perfil',
  ctaRoles: 'Gestionar roles',
  adminTitle: 'Administración',
  adminStub:
    'Área admin (permiso admin.panel): resumen operativo, usuarios y revisión de Confianza.',
  adminForbidden:
    'No tiene permiso para esta área (admin.panel). Si cree que es un error, contacte a Kuteka.',
  configMissing:
    'El área autenticada requiere la configuración de Supabase. Defina las variables de entorno e inténtelo de nuevo.',
};

const APP_BY_LOCALE: Record<AppLocale, AppCopy> = {
  pt: authCopyPt.app,
  en: appEn,
  fr: appFr,
  es: appEs,
};

/** Auth UI copy — home/dashboard follows locale; remaining auth flows fall back to pt-AO until full packs land. */
export function getAuthCopy(locale: AppLocale | 'pt' | 'en' = 'pt'): AuthCopy {
  const app = APP_BY_LOCALE[locale as AppLocale] ?? authCopyPt.app;
  return { ...authCopyPt, app };
}

export type { AuthCopy };
