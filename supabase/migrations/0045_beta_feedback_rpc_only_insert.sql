-- 0045_beta_feedback_rpc_only_insert.sql
-- Applied from docs/engineering/proposals/0045 (Founder authorization granted).
-- Force beta_feedback writes through kocc_submit_beta_feedback (security definer).

revoke insert on public.beta_feedback from authenticated;

-- Keep SELECT for ops/Founder via RLS; RPC remains the write path.
grant select on public.beta_feedback to authenticated;
grant execute on function public.kocc_submit_beta_feedback(text, text, text) to authenticated;

comment on table public.beta_feedback is
  'Sprint Beta — feedback/bugs. INSERT only via kocc_submit_beta_feedback; SELECT ops/Founder.';
