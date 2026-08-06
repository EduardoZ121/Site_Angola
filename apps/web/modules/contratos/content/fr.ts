import type { ContratosCopy } from './pt';

export const contratosCopyFr: ContratosCopy = {
  title: 'Contrats',
  subtitle:
    'Formalisez l’intention approuvée en contrat, avec parties, montant, conditions et statuts clairs.',
  create: 'Préparer un contrat',
  createTitle: 'Préparer un nouveau contrat',
  createHint:
    'Choisissez un patrimoine actif, identifiez le Client et enregistrez le projet avant le paiement.',
  creating: 'Préparation…',
  created: 'Contrat préparé pour acceptation.',
  detailTitle: 'Détail du contrat',
  demoNote:
    'Inventaire Bêta : contrats liés à l’inventaire KTK-DEMO pour montrer le processus en action.',
  emptyTitle: 'Aucun contrat pour le moment',
  empty:
    'Lorsque Confiance et Administration auront validé les parties, préparez le premier contrat pour passer aux Paiements.',
  emptyDemo:
    'Si la base est vide, exécutez la migration PRD-008 pour charger les contrats d’inventaire Bêta KTK-CTR.',
  loadError: 'Nous avons du mal à afficher les contrats. Veuillez réessayer.',
  saveError: 'Nous n’avons pas pu préparer le contrat. Vérifiez les données et réessayez.',
  transitionError: 'Nous n’avons pas pu mettre à jour le contrat. Veuillez réessayer.',
  forbidden:
    'L’espace Contrats devient disponible lorsque votre compte a le rôle approprié (Client, Partenaire, Agent ou Admin).',
  kycRequired:
    'L’identité vérifiée est obligatoire (KYC niveau 2+) : complétez le Profil et la Confiance du Client et du Partenaire avant de formaliser des contrats réels.',
  kycBanner:
    'Les contrats réels exigent une Identité Réelle (document validé). Complétez votre Profil si ce n’est pas déjà fait.',
  kycBannerCta: 'Ouvrir le Profil KYC',
  accept: 'Accepter le contrat',
  accepting: 'Acceptation…',
  accepted: 'Contrat actif. La prochaine étape est de préparer le paiement.',
  cancel: 'Annuler le contrat',
  cancelling: 'Annulation…',
  cancelled: 'Contrat annulé.',
  complete: 'Marquer comme terminé',
  completing: 'Finalisation…',
  completed: 'Contrat terminé.',
  openDetail: 'Ouvrir le contrat',
  preparePayment: 'Préparer le paiement',
  paymentsSoon:
    'Paiements en cours de déploiement — suivez pour l’instant depuis le tableau de bord.',
  fields: {
    code: 'Code',
    property: 'Patrimoine',
    propertyId: 'ID du patrimoine',
    clientId: 'ID du Client',
    agentId: 'ID de l’Agent (facultatif)',
    interestId: 'ID de l’intérêt (facultatif)',
    purpose: 'Finalité',
    amount: 'Montant (AOA)',
    title: 'Titre',
    titlePlaceholder: 'Ex. : Contrat de location — Appartement T3 à Kilamba',
    terms: 'Conditions et notes',
    termsPlaceholder: 'Incluez les conditions essentielles, les délais et les responsabilités.',
    status: 'État',
    createdAt: 'Créé',
    updatedAt: 'Mis à jour',
    parties: 'Parties',
    partner: 'Partenaire',
    client: 'Client',
    agent: 'Agent',
    payment: 'Paiement',
  },
  purposes: {
    rent: 'Location',
    sale: 'Vente',
  },
  statuses: {
    draft: 'Brouillon',
    pending_acceptance: 'En attente d’acceptation',
    active: 'Actif',
    completed: 'Terminé',
    cancelled: 'Annulé',
  },
};
