import { z } from 'zod';

export const TRUST_DOC_TYPES = [
  'identity',
  'proof_of_address',
  'property_title',
  'agent_credential',
] as const;

export const TRUST_DOC_STATUSES = ['submitted', 'under_review', 'accepted', 'rejected'] as const;

export const TRUST_REVIEW_STATUSES = ['accepted', 'rejected', 'under_review'] as const;

export const submitTrustDocumentSchema = z.object({
  docType: z.enum(TRUST_DOC_TYPES, {
    errorMap: () => ({ message: 'Tipo de verificação inválido.' }),
  }),
  notes: z.string().trim().max(2000).optional().nullable(),
  propertyId: z.string().uuid('Património inválido.').optional().nullable(),
});

export const reviewTrustDocumentSchema = z
  .object({
    documentId: z.string().uuid('Documento inválido.'),
    status: z.enum(TRUST_REVIEW_STATUSES, {
      errorMap: () => ({ message: 'Estado de revisão inválido.' }),
    }),
    rejectionReason: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.status === 'rejected' && !value.rejectionReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indique o motivo da rejeição.',
        path: ['rejectionReason'],
      });
    }
  });

export type SubmitTrustDocumentInput = z.infer<typeof submitTrustDocumentSchema>;
export type ReviewTrustDocumentInput = z.infer<typeof reviewTrustDocumentSchema>;
