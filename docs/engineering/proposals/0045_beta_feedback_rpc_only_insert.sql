-- PROPOSAL ONLY — do not apply without review.
-- Goal: force beta_feedback writes through kocc_submit_beta_feedback (client sanitize + tracking).
-- Out of scope: Founder RLS (0043), path truncate (0044), ticket workflow / UPDATE policies.
--
-- Current 0035 grants INSERT to authenticated (own actor_id). Official UI uses the RPC;
-- a direct insert bypasses client sanitizeBetaPagePath / body normalize / kind-specific track.
--
-- Suggested change (additive revoke; RPC remains security definer):
/*
revoke insert on public.beta_feedback from authenticated;
-- keep: grant select on public.beta_feedback to authenticated;
-- keep: grant execute on function public.kocc_submit_beta_feedback(text, text, text) to authenticated;
*/
