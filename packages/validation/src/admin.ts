import { z } from 'zod';

export const assignCertifiedAgentSchema = z.object({
  userId: z.string().uuid('Utilizador inválido.'),
});

export type AssignCertifiedAgentInput = z.infer<typeof assignCertifiedAgentSchema>;
