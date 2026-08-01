import { z } from 'zod';
import { PROPERTY_PURPOSES } from './property';

export const clientPreferencesSchema = z.object({
  purpose: z
    .enum(PROPERTY_PURPOSES, {
      errorMap: () => ({ message: 'Seleccione a finalidade pretendida.' }),
    })
    .optional()
    .nullable(),
  province: z.string().trim().max(80).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
});

export type ClientPreferencesInput = z.infer<typeof clientPreferencesSchema>;
