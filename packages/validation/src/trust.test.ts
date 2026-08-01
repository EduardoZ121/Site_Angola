import { describe, expect, it } from 'vitest';
import { reviewTrustDocumentSchema, submitTrustDocumentSchema } from './trust';

describe('submitTrustDocumentSchema', () => {
  it('accepts valid checklist item', () => {
    expect(
      submitTrustDocumentSchema.safeParse({
        docType: 'identity',
        notes: 'BI válido até 2030',
      }).success,
    ).toBe(true);
  });

  it('rejects unknown doc type', () => {
    expect(
      submitTrustDocumentSchema.safeParse({
        docType: 'passport',
      }).success,
    ).toBe(false);
  });
});

describe('reviewTrustDocumentSchema', () => {
  it('requires rejection reason when rejected', () => {
    expect(
      reviewTrustDocumentSchema.safeParse({
        documentId: '11111111-1111-4111-8111-111111111111',
        status: 'rejected',
      }).success,
    ).toBe(false);

    expect(
      reviewTrustDocumentSchema.safeParse({
        documentId: '11111111-1111-4111-8111-111111111111',
        status: 'rejected',
        rejectionReason: 'Dados incompletos',
      }).success,
    ).toBe(true);
  });

  it('accepts accepted without reason', () => {
    expect(
      reviewTrustDocumentSchema.safeParse({
        documentId: '11111111-1111-4111-8111-111111111111',
        status: 'accepted',
      }).success,
    ).toBe(true);
  });
});
