/** Pure labels for beta_feedback.kind — shared by KOCC inbox UI + tests. */
export function betaFeedbackKindLabel(kind: string): string {
  if (kind === 'bug') return 'Bug';
  if (kind === 'feedback') return 'Feedback';
  return kind;
}
