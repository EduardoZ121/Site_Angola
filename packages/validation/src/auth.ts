import { z } from 'zod';

/** R5 — trim + lowercase before validate / API */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** R4 — MVP password policy (≥8, ≥1 upper, ≥1 digit; symbol not required) */
export const passwordRules = {
  minLength: (value: string) => value.length >= 8,
  hasUpper: (value: string) => /[A-ZÀ-Ý]/.test(value),
  hasDigit: (value: string) => /\d/.test(value),
  isValid(value: string): boolean {
    return this.minLength(value) && this.hasUpper(value) && this.hasDigit(value);
  },
} as const;

export const passwordSchema = z
  .string()
  .min(1, 'Indique a password.')
  .refine((v) => passwordRules.minLength(v), {
    message: 'A password deve ter pelo menos 8 caracteres.',
  })
  .refine((v) => passwordRules.hasUpper(v), {
    message: 'A password deve incluir pelo menos uma letra maiúscula.',
  })
  .refine((v) => passwordRules.hasDigit(v), {
    message: 'A password deve incluir pelo menos um número.',
  });

const emailField = z
  .string()
  .min(1, 'Indique o email.')
  .transform(normalizeEmail)
  .pipe(z.string().email('Indique um email válido.'));

export const registerSchema = z
  .object({
    email: emailField,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a password.'),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: 'Deve aceitar os Termos para criar a conta.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As passwords não coincidem.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Indique a password.'),
});

export const recoverSchema = z.object({
  email: emailField,
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirme a password.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As passwords não coincidem.',
    path: ['confirmPassword'],
  });

export const SELF_SERVE_ROLE_CODES = ['client', 'patrimonial_partner'] as const;
export type SelfServeRoleCode = (typeof SELF_SERVE_ROLE_CODES)[number];

export const onboardingRolesSchema = z
  .object({
    roles: z.array(z.enum(SELF_SERVE_ROLE_CODES)).min(1, 'Escolha pelo menos um papel.'),
  })
  .refine(
    (data) => data.roles.every((r) => SELF_SERVE_ROLE_CODES.includes(r)),
    'Só é possível activar Cliente ou Parceiro Patrimonial.',
  );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RecoverInput = z.infer<typeof recoverSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;
export type OnboardingRolesInput = z.infer<typeof onboardingRolesSchema>;
