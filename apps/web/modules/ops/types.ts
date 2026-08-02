export type KaiInsight = {
  id: string;
  tone: 'info' | 'warn' | 'success' | 'predict';
  title: string;
  body: string;
  href?: string;
};

export type OpsContract = {
  id: string;
  code: string | null;
  status: string;
  purpose: string;
  amountAoa: number;
  startsOn: string | null;
  endsOn: string | null;
  depositAoa: number | null;
  nextPaymentDue: string | null;
  nextPaymentAmountAoa: number | null;
  exitIntent: string;
  exitIntentDate: string | null;
  exitReason: string | null;
  propertyId: string;
  propertyTitle: string | null;
  propertyCode: string | null;
  daysRemaining: number | null;
  daysUntilPayment: number | null;
  lateDays: number;
};

export type OpsPayment = {
  id: string;
  dueOn: string;
  amountAoa: number;
  status: string;
  lateDays: number;
  penaltyAoa: number;
};

export type OpsMaintenance = {
  id: string;
  category: string;
  title: string;
  status: string;
  createdAt: string;
};

export type OpsFutureProperty = {
  id: string;
  title: string | null;
  code: string | null;
  city: string | null;
  expectedAvailableOn: string;
  availabilityNote: string | null;
  daysUntilFree: number;
};

export type OpsStats = {
  // shared
  users: number;
  trustPending: number;
  // client
  interests: number;
  clientContracts: OpsContract[];
  paymentsPaid: number;
  paymentsPending: number;
  paymentsLate: number;
  maintenanceOpen: number;
  // partner
  propertiesTotal: number;
  propertiesActive: number;
  propertiesOccupied: number;
  propertiesAvailable: number;
  propertiesFutureFree: number;
  vacantDaysEstimate: number;
  monthlyRevenueAoa: number;
  annualRevenueAoa: number;
  partnerContractsActive: number;
  partnerContractsExpiring: number;
  pipelineInterests: number;
  pipelineVisits30: number;
  pipelineProposals30: number;
  reviewAvg: number | null;
  reviews: number;
  futureProperties: OpsFutureProperty[];
  // agent
  assignments: number;
  agentContracts: number;
  // admin/exec
  contractsActiveTotal: number;
  contractsCompletedTotal: number;
  partnersCount: number;
  clientsCount: number;
  agentsCount: number;
  occupancyPct: number | null;
  avgDaysToFree: number | null;
};
