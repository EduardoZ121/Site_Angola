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
  status: z.enum(PROPERTY_STATUSES).default('active'),
});

export type ActivatePropertyInput = z.infer<typeof activatePropertySchema>;
