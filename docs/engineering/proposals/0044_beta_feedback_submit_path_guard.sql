-- APPLIED as supabase/migrations/0044_beta_feedback_submit_path_guard.sql
-- (Founder authorization — kuteka ecosystem execution)
-- Original proposal retained for history.

-- Additive hardening for kocc_submit_beta_feedback (migration 0035).
-- Truncate page_path server-side (defense in depth; client already sanitizes).
