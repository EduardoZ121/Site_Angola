import { z } from 'zod';

export const roleCodeSchema = z.string().min(2).max(64);

export const permissionCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, 'Invalid permission code');

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  locale: z.enum(['pt', 'en', 'fr', 'es']).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'degraded', 'error']),
  version: z.string(),
  timestamp: z.string(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export {
  normalizeEmail,
  passwordRules,
  passwordSchema,
  registerSchema,
  loginSchema,
  recoverSchema,
  newPasswordSchema,
  onboardingRolesSchema,
  SELF_SERVE_ROLE_CODES,
  type SelfServeRoleCode,
  type RegisterInput,
  type LoginInput,
  type RecoverInput,
  type NewPasswordInput,
  type OnboardingRolesInput,
} from './auth';

export {
  PROPERTY_TYPES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  KUTEKA_SERVICES,
  MANAGEMENT_LEVELS,
  RENOVATION_REQUESTS,
  UNFINISHED_INTENTS,
  CONSTRUCTION_STATUSES,
  CONSERVATION_STATES,
  propertyRequiresEvaluation,
  activatePropertySchema,
  expressInterestSchema,
  type ActivatePropertyInput,
  type ExpressInterestInput,
  type KutekaService,
  type ManagementLevel,
} from './property';

export { clientPreferencesSchema, type ClientPreferencesInput } from './housing';

export {
  agentPreferencesSchema,
  activateAssignmentSchema,
  type AgentPreferencesInput,
  type ActivateAssignmentInput,
} from './agent';

export { assignCertifiedAgentSchema, type AssignCertifiedAgentInput } from './admin';

export {
  TRUST_DOC_TYPES,
  TRUST_DOC_STATUSES,
  TRUST_REVIEW_STATUSES,
  submitTrustDocumentSchema,
  reviewTrustDocumentSchema,
  type SubmitTrustDocumentInput,
  type ReviewTrustDocumentInput,
} from './trust';

export {
  SEX_CODES,
  MARITAL_STATUS_CODES,
  ID_DOC_KINDS,
  KYC_LEVELS,
  VERIFICATION_STATUSES,
  identityPersonalSchema,
  identityContactsSchema,
  identityAddressSchema,
  identityIdDocumentSchema,
  identityBankingSchema,
  type IdentityPersonalInput,
  type IdentityContactsInput,
  type IdentityAddressInput,
  type IdentityIdDocumentInput,
  type IdentityBankingInput,
} from './identity';

export {
  FINANCE_PRODUCT_CATEGORIES,
  FINANCE_PRICING_MODELS,
  FINANCE_URGENCY_BANDS,
  FINANCE_REFUND_MODES,
  FINANCE_CRM_ACCOUNT_TYPES,
  FINANCE_FRAUD_SEVERITIES,
  FINANCE_FRAUD_STATUSES,
  FINANCE_EXPORT_FORMATS,
  FINANCE_COMMISSION_PAYER_SIDES,
  KUTEKA_PAY_MODULE_CODES,
  KUTEKA_PAY_ADAPTER_CODES,
  KUTEKA_PAY_WEBHOOK_EVENTS,
  kutekaPayCreateIntentSchema,
  kutekaPayIntentIdSchema,
  kutekaPayFailSchema,
  kutekaPaySimulateWebhookSchema,
  kutekaPaySetDefaultGatewaySchema,
  financeQuoteSchema,
  financeSandboxPaymentSchema,
  financeCaptureSchema,
  financeGrantCreditsSchema,
  financeUpdatePriceRuleSchema,
  financeConsentSchema,
  financeRedeemCreditsSchema,
  financeCreateRefundSchema,
  financeOpenDisputeSchema,
  financeRunReconciliationSchema,
  financeInvoicePdfSchema,
  financeMarkInvoiceEmailedSchema,
  financeUpsertProductSchema,
  financeSetCommissionSchema,
  financeUpsertKaiRuleSchema,
  financeFlagFraudSchema,
  financeResolveFraudSchema,
  financeUpsertCrmAccountSchema,
  financeCreateExportSchema,
  type FinanceQuoteInput,
  type FinanceSandboxPaymentInput,
  type FinanceCaptureInput,
  type FinanceGrantCreditsInput,
  type FinanceUpdatePriceRuleInput,
  type FinanceConsentInput,
  type FinanceRedeemCreditsInput,
  type FinanceCreateRefundInput,
  type FinanceOpenDisputeInput,
  type FinanceRunReconciliationInput,
  type FinanceInvoicePdfInput,
  type FinanceMarkInvoiceEmailedInput,
  type FinanceUpsertProductInput,
  type FinanceSetCommissionInput,
  type FinanceUpsertKaiRuleInput,
  type FinanceFlagFraudInput,
  type FinanceResolveFraudInput,
  type FinanceUpsertCrmAccountInput,
  type FinanceCreateExportInput,
  type KutekaPayCreateIntentInput,
  type KutekaPayIntentIdInput,
  type KutekaPayFailInput,
  type KutekaPaySimulateWebhookInput,
  type KutekaPaySetDefaultGatewayInput,
} from './finance';

export {
  MARKETPLACE_ORDER_STATUSES,
  MARKETPLACE_PROVIDER_CATEGORIES,
  marketplaceCreateOrderSchema,
  marketplaceSubmitQuoteSchema,
  marketplaceOrderIdSchema,
  marketplacePayOrderSchema,
  marketplaceCancelOrderSchema,
  marketplaceRateOrderSchema,
  type MarketplaceOrderStatus,
  type MarketplaceCreateOrderInput,
  type MarketplaceSubmitQuoteInput,
  type MarketplaceOrderIdInput,
  type MarketplacePayOrderInput,
  type MarketplaceCancelOrderInput,
  type MarketplaceRateOrderInput,
} from './marketplace';

export {
  SMART_MOVE_STATUSES,
  SMART_MOVE_EVENT_TYPES,
  smartMoveCreateSchema,
  smartMoveRequestIdSchema,
  smartMoveMatchSchema,
  smartMoveRejectSchema,
  smartMoveFailSchema,
  smartMoveCancelSchema,
  type SmartMoveStatus,
  type SmartMoveEventType,
  type SmartMoveCreateInput,
  type SmartMoveRequestIdInput,
  type SmartMoveMatchInput,
  type SmartMoveRejectInput,
  type SmartMoveFailInput,
  type SmartMoveCancelInput,
} from './smart-move';

export {
  FIND_HOME_STATUSES,
  FIND_HOME_EVENT_TYPES,
  FIND_HOME_TYPOLOGIES,
  findHomeCreateSchema,
  findHomeRequestIdSchema,
  findHomeMatchSchema,
  findHomeRejectSchema,
  findHomeFailSchema,
  findHomeCancelSchema,
  type FindHomeStatus,
  type FindHomeEventType,
  type FindHomeTypology,
  type FindHomeCreateInput,
  type FindHomeRequestIdInput,
  type FindHomeMatchInput,
  type FindHomeRejectInput,
  type FindHomeFailInput,
  type FindHomeCancelInput,
} from './find-home';

export {
  CONCIERGE_STATUSES,
  CONCIERGE_EVENT_TYPES,
  CONCIERGE_CATEGORIES,
  conciergeCreateSchema,
  conciergeRequestIdSchema,
  conciergeOperatorActionSchema,
  conciergeCancelSchema,
  conciergeFailSchema,
  type ConciergeStatus,
  type ConciergeEventType,
  type ConciergeCategory,
  type ConciergeCreateInput,
  type ConciergeRequestIdInput,
  type ConciergeOperatorActionInput,
  type ConciergeCancelInput,
  type ConciergeFailInput,
} from './concierge';

export {
  CONTRACT_PURPOSES,
  CONTRACT_STATUSES,
  createPropertyContractSchema,
  contractTransitionSchema,
  type CreatePropertyContractInput,
  type ContractTransitionInput,
} from './contracts';
