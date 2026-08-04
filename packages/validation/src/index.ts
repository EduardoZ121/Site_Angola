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
  CONTRACT_PURPOSES,
  CONTRACT_STATUSES,
  createPropertyContractSchema,
  contractTransitionSchema,
  type CreatePropertyContractInput,
  type ContractTransitionInput,
} from './contracts';
