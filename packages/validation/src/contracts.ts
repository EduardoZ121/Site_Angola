import { z } from 'zod';

export const CONTRACT_PURPOSES = ['rent', 'sale'] as const;
export const CONTRACT_STATUSES = [
  'draft',
  'pending_acceptance',
  'active',
  'completed',
  'cancelled',
] as const;

export const createPropertyContractSchema = z.object({
  propertyId: z.string().uuid('Património inválido.'),
  clientId: z.string().uuid('Cliente inválido.'),
  agentId: z.string().uuid('Agente inválido.').optional().nullable(),
  interestId: z.string().uuid('Interesse inválido.').optional().nullable(),
  purpose: z.enum(CONTRACT_PURPOSES, {
    errorMap: () => ({ message: 'Seleccione a finalidade do contrato.' }),
  }),
  amountAoa: z
    .number({ invalid_type_error: 'Indique um valor válido.' })
    .positive('O valor deve ser positivo.')
    .max(1_000_000_000_000, 'Valor demasiado elevado.'),
  title: z
    .string()
    .trim()
    .min(3, 'Indique um título com pelo menos 3 caracteres.')
    .max(140, 'O título é demasiado longo.'),
  termsNotes: z.string().trim().max(4000).optional().nullable(),
});

export const contractTransitionSchema = z.object({
  contractId: z.string().uuid('Contrato inválido.'),
});

export type CreatePropertyContractInput = z.infer<typeof createPropertyContractSchema>;
export type ContractTransitionInput = z.infer<typeof contractTransitionSchema>;
