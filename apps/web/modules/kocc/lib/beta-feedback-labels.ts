/** Pure labels for beta_feedback.kind — shared by KOCC inbox UI + tests. */
export function betaFeedbackKindLabel(kind: string): string {
  if (kind === 'bug') return 'Bug';
  // Align with Help form + inbox filter ("Sugestões") — schema value remains `feedback`.
  if (kind === 'feedback') return 'Sugestão';
  return kind;
}
