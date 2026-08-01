import { z } from 'zod';

export const roleCodeSchema = z.string().min(2).max(64);

export const permissionCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, 'Invalid permission code');

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(120).optional(),
  locale: z.enum(['pt', 'en']).optional(),
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
  activatePropertySchema,
  type ActivatePropertyInput,
} from './property';

export { clientPreferencesSchema, type ClientPreferencesInput } from './housing';

export {
  agentPreferencesSchema,
  activateAssignmentSchema,
  type AgentPreferencesInput,
  type ActivateAssignmentInput,
} from './agent';

export { assignCertifiedAgentSchema, type AssignCertifiedAgentInput } from './admin';
