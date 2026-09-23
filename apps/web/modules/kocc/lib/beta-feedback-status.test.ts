import { describe, expect, it } from 'vitest';
import {
  canTransitionBetaFeedbackStatus,
  isBetaFeedbackStatus,
  isValidBetaFeedbackKindExpanded,
  sanitizeBetaPageContext,
  betaFeedbackStatusLabel,
} from './beta-feedback-status';

describe('beta feedback status workflow', () => {
  it('accepts Doc3 statuses', () => {
    expect(isBetaFeedbackStatus('received')).toBe(true);
    expect(isBetaFeedbackStatus('nao_reproduzivel')).toBe(true);
    expect(isBetaFeedbackStatus('closed')).toBe(false);
  });

  it('expands kinds safely', () => {
    expect(isValidBetaFeedbackKindExpanded('feedback')).toBe(true);
    expect(isValidBetaFeedbackKindExpanded('avaliacao')).toBe(true);
    expect(isValidBetaFeedbackKindExpanded('reclamacao')).toBe(true);
    expect(isValidBetaFeedbackKindExpanded('ticket')).toBe(false);
  });

  it('allows reopen from terminal to em_analise', () => {
    expect(canTransitionBetaFeedbackStatus('resolvido', 'em_analise')).toBe(true);
    expect(canTransitionBetaFeedbackStatus('resolvido', 'em_desenvolvimento')).toBe(false);
    expect(canTransitionBetaFeedbackStatus('received', 'em_analise')).toBe(true);
  });

  it('labels statuses in PT', () => {
    expect(betaFeedbackStatusLabel('em_desenvolvimento')).toBe('Em desenvolvimento');
  });

  it('strips screenshot keys from page_context', () => {
    expect(
      sanitizeBetaPageContext({
        locale: 'pt',
        screenshot: 'data:image/png;base64,xxx',
        route: '/app/ajuda',
      }),
    ).toEqual({ locale: 'pt', route: '/app/ajuda' });
  });
});
