import { z } from 'zod';

export const SEX_CODES = ['female', 'male', 'other', 'undisclosed'] as const;
export const MARITAL_STATUS_CODES = [
  'single',
  'married',
  'de_facto',
  'divorced',
  'widowed',
  'undisclosed',
] as const;
export const ID_DOC_KINDS = ['bi', 'passport', 'residence_card', 'other'] as const;
export const KYC_LEVELS = [0, 1, 2, 3, 4] as const;
export const VERIFICATION_STATUSES = ['missing', 'pending', 'verified', 'rejected'] as const;

export const identityPersonalSchema = z.object({
  legalFullName: z.string().trim().min(3, 'Indique o nome completo conforme o documento.').max(200),
  preferredName: z.string().trim().max(120).optional().nullable(),
  sex: z.enum(SEX_CODES).optional().nullable(),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida.')
    .optional()
    .nullable(),
  nationality: z.string().trim().min(2).max(80).optional().nullable(),
  placeOfBirth: z.string().trim().max(120).optional().nullable(),
  maritalStatus: z.enum(MARITAL_STATUS_CODES).optional().nullable(),
});

export const identityContactsSchema = z.object({
  phonePrimary: z
    .string()
    .trim()
    .min(8, 'Telefone principal inválido.')
    .max(32)
    .optional()
    .nullable(),
  phoneSecondary: z.string().trim().max(32).optional().nullable(),
  emailSecondary: z
    .string()
    .trim()
    .email('Email secundário inválido.')
    .optional()
    .nullable()
    .or(z.literal('')),
  markPhoneVerified: z.boolean().optional(),
});

export const identityAddressSchema = z.object({
  country: z.string().trim().min(2).max(2).default('AO'),
  province: z.string().trim().min(2, 'Província obrigatória.').max(80),
  municipality: z.string().trim().min(2, 'Município obrigatório.').max(80),
  commune: z.string().trim().max(80).optional().nullable(),
  neighborhood: z.string().trim().max(80).optional().nullable(),
  street: z.string().trim().max(160).optional().nullable(),
  number: z.string().trim().max(40).optional().nullable(),
  postalCode: z.string().trim().max(20).optional().nullable(),
  gpsLat: z.number().min(-90).max(90).optional().nullable(),
  gpsLng: z.number().min(-180).max(180).optional().nullable(),
  submitForReview: z.boolean().optional(),
});

export const identityIdDocumentSchema = z.object({
  docKind: z.enum(ID_DOC_KINDS, {
    errorMap: () => ({ message: 'Tipo de documento inválido.' }),
  }),
  docNumber: z.string().trim().min(3, 'Número do documento obrigatório.').max(64),
  issuedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de emissão inválida.')
    .optional()
    .nullable(),
  expiresOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de validade inválida.')
    .optional()
    .nullable(),
  issuedAt: z.string().trim().max(120).optional().nullable(),
  issuingCountry: z.string().trim().min(2).max(2).default('AO'),
});

export const identityBankingSchema = z.object({
  bankName: z.string().trim().max(120).optional().nullable(),
  iban: z.string().trim().max(34).optional().nullable(),
  accountNumber: z.string().trim().max(64).optional().nullable(),
  accountHolderName: z.string().trim().max(200).optional().nullable(),
  digitalWallets: z.array(z.string().trim().max(80)).max(10).optional(),
  submitForReview: z.boolean().optional(),
});

export type IdentityPersonalInput = z.infer<typeof identityPersonalSchema>;
export type IdentityContactsInput = z.infer<typeof identityContactsSchema>;
export type IdentityAddressInput = z.infer<typeof identityAddressSchema>;
export type IdentityIdDocumentInput = z.infer<typeof identityIdDocumentSchema>;
export type IdentityBankingInput = z.infer<typeof identityBankingSchema>;
