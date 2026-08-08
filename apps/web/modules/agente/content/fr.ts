import type { AgenteCopy } from './pt';

export const agenteCopyFr: AgenteCopy = {
  title: 'Agent Certifié',
  subtitle:
    'Représentez Kuteka sur le terrain : définissez votre zone de couverture, explorez l’inventaire actif et activez des suivis.',
  explore: 'Explorer l’inventaire',
  preferencesTitle: 'Préférences de couverture',
  preferencesHint: 'Indiquez la zone et la finalité dans lesquelles vous souhaitez opérer.',
  savePreferences: 'Enregistrer les préférences',
  saving: 'Enregistrement…',
  saved: 'Préférences enregistrées.',
  needAgent:
    'Les opérations réelles nécessitent le rôle Agent Certifié (attribué par l’Administration). Ci-dessous une prévisualisation Bêta du pipeline.',
  demoTitle: 'Prévisualisation Bêta du pipeline',
  demoHint:
    'Données illustratives avec l’inventaire Bêta — pour découvrir le parcours sans permission d’agent.',
  demoVisits: 'Visites',
  demoAgenda: 'Agenda',
  demoPipeline: 'Pipeline',
  requestAgent: 'Demander l’activation (contact)',
  requestAgentHint:
    'Le rôle Agent Certifié est attribué par l’Administration. Contactez Kuteka ou continuez à explorer la prévisualisation Bêta.',
  loadError: 'Nous avons du mal à afficher l’espace Agent. Veuillez réessayer.',
  saveError: 'Nous n’avons pas pu enregistrer. Veuillez réessayer.',
  forbidden: 'Vous n’avez pas la permission d’Agent Certifié.',
  exploreTitle: 'Inventaire actif',
  exploreSubtitle: 'Patrimoines disponibles pour un suivi responsable sur le terrain.',
  emptyExploreTitle: 'Aucun patrimoine dans cette couverture',
  emptyExplore:
    'Il n’y a pas de patrimoines actifs avec les filtres actuels. Ajustez la couverture ou explorez à nouveau plus tard.',
  emptyAssignmentsTitle: 'Aucun suivi actif',
  emptyAssignments:
    'Lorsque vous activerez un suivi, il sera enregistré ici pour suivre votre travail de terrain.',
  emptyAssignmentsCta: 'Explorer l’inventaire',
  assignmentsTitle: 'Suivis actifs',
  activate: 'Activer le suivi',
  activating: 'Activation…',
  activated: 'Suivi activé.',
  alreadyAssigned: 'Vous avez déjà un suivi actif pour ce patrimoine.',
  backToHub: 'Retour à l’espace Agent',
  backToExplore: 'Retour à l’inventaire',
  detailTitle: 'Patrimoine à suivre',
  openDetail: 'Ouvrir la fiche',
  mvpNote:
    'Concentrez-vous sur la couverture et les suivis. Les visites, propositions et l’Académie seront introduites dans les phases suivantes.',
  viewHousingInventory: 'Voir l’inventaire',
  activateAgentAdmin: 'Activer l’agent (Admin)',
  nextSteps: {
    title: 'Continuer le parcours Kuteka',
    viewActiveProperties: 'Voir les patrimoines actifs',
    verifyAccount: 'Vérifier le compte',
    administration: 'Administration',
    contactKuteka: 'Contacter Kuteka',
  },
  fields: {
    purpose: 'Finalité',
    province: 'Province',
    city: 'Ville',
    type: 'Type',
    address: 'Adresse',
    code: 'Code',
    notes: 'Notes de terrain (facultatif)',
    any: 'Indifférent',
    status: 'État',
  },
  types: {
    apartment: 'Appartement',
    house: 'Villa',
    land: 'Terrain',
    commercial: 'Commercial',
  },
  purposes: {
    rent: 'Location',
    sale: 'Vente',
    both: 'Vente et location',
  },
  statuses: {
    active: 'Actif',
    released: 'Libéré',
  },
};
