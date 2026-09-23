import { describe, expect, it } from 'vitest';
import { betaFeedbackKindLabel } from './beta-feedback-labels';

describe('betaFeedbackKindLabel', () => {
  it('labels known kinds', () => {
    expect(betaFeedbackKindLabel('bug')).toBe('Bug');
    expect(betaFeedbackKindLabel('feedback')).toBe('Sugestão');
    expect(betaFeedbackKindLabel('avaliacao')).toBe('Avaliação');
    expect(betaFeedbackKindLabel('reclamacao')).toBe('Reclamação');
  });

  it('passes through unknown kinds', () => {
    expect(betaFeedbackKindLabel('other')).toBe('other');
  });
});
