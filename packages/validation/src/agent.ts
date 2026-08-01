import { z } from 'zod';
import { PROPERTY_PURPOSES } from './property';

export const agentPreferencesSchema = z.object({
  purpose: z
    .enum(PROPERTY_PURPOSES, {
      errorMap: () => ({ message: 'Seleccione a finalidade de cobertura.' }),
    })
    .optional()
    .nullable(),
  province: z.string().trim().max(80).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
});

export const activateAssignmentSchema = z.object({
  propertyId: z.string().uuid('Património inválido.'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type AgentPreferencesInput = z.infer<typeof agentPreferencesSchema>;
export type ActivateAssignmentInput = z.infer<typeof activateAssignmentSchema>;
