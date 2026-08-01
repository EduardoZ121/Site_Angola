import { z } from 'zod';

export const PROPERTY_TYPES = ['apartment', 'house', 'land', 'commercial'] as const;
export const PROPERTY_PURPOSES = ['rent', 'sale', 'both'] as const;
export const PROPERTY_STATUSES = ['draft', 'active', 'archived'] as const;

export const activatePropertySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Indique um título com pelo menos 3 caracteres.')
    .max(120, 'O título é demasiado longo.'),
  propertyType: z.enum(PROPERTY_TYPES, {
    errorMap: () => ({ message: 'Seleccione o tipo de património.' }),
  }),
  purpose: z.enum(PROPERTY_PURPOSES, {
    errorMap: () => ({ message: 'Seleccione a finalidade.' }),
  }),
  province: z.string().trim().max(80).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  addressLine: z.string().trim().max(160).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  priceAoa: z
    .number({ invalid_type_error: 'Indique um preço válido.' })
    .positive('O preço deve ser positivo.')
    .max(1_000_000_000_000, 'Preço demasiado elevado.')
    .optional()
    .nullable(),
  bedrooms: z
    .number({ invalid_type_error: 'Indique o número de quartos.' })
    .int()
    .min(0)
    .max(50)
    .optional()
    .nullable(),
  status: z.enum(PROPERTY_STATUSES).default('active'),
});

export const expressInterestSchema = z.object({
  propertyId: z.string().uuid('Património inválido.'),
  notes: z.string().trim().max(1000).optional().nullable(),
});

export type ActivatePropertyInput = z.infer<typeof activatePropertySchema>;
export type ExpressInterestInput = z.infer<typeof expressInterestSchema>;
