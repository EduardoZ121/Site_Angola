/** Ops triage: short actor hint from beta_feedback.actor_id (already SELECT-visible via RLS). */
export function formatBetaActorHint(actorId: string | null | undefined): string | null {
  if (!actorId) return null;
  const id = actorId.trim();
  if (!id) return null;
  return `actor:${id.slice(0, 8)}`;
}
