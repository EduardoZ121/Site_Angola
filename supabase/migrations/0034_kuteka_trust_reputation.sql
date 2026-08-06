-- 0034_kuteka_trust_reputation.sql
-- Sprint Beta 1.5 — Trust & Reputation visibility (reputation-only bits).
-- Adds read-only, SECURITY DEFINER aggregate RPCs so the Trust Card can show
-- reputation (ratings, ICK, contracts completed, KIS level, member since)
-- for a property or another user without loosening the underlying RLS on
-- `profiles` / `property_contracts`. Only non-sensitive aggregate figures are
-- exposed — no documents, contacts or banking data. Additive only; does not
-- touch chat (handled separately in 0033_kuteka_chat_trust.sql when present).

-- ─── Property reputation summary ────────────────────────────────────────────
create or replace function public.get_property_trust_summary(p_property_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_kuteka_score numeric;
  v_rating_avg numeric;
  v_rating_count integer;
  v_last_review_at timestamptz;
  v_contracts_completed integer;
begin
  if p_property_id is null then
    return null;
  end if;

  select kuteka_score into v_kuteka_score
  from public.properties
  where id = p_property_id and deleted_at is null;

  if not found then
    return null;
  end if;

  select avg(rating)::numeric, count(*)::int, max(created_at)
  into v_rating_avg, v_rating_count, v_last_review_at
  from public.contract_reviews
  where property_id = p_property_id
    and subject_kind = 'property';

  select count(*)::int into v_contracts_completed
  from public.property_contracts
  where property_id = p_property_id
    and status = 'completed'
    and deleted_at is null;

  return jsonb_build_object(
    'propertyId', p_property_id,
    'kutekaScore', v_kuteka_score,
    'ratingAvg', v_rating_avg,
    'ratingCount', coalesce(v_rating_count, 0),
    'contractsCompleted', coalesce(v_contracts_completed, 0),
    'lastReviewAt', v_last_review_at
  );
end;
$$;

revoke all on function public.get_property_trust_summary(uuid) from public;
grant execute on function public.get_property_trust_summary(uuid) to authenticated;

-- ─── User (owner / agent / client) reputation summary ───────────────────────
create or replace function public.get_user_trust_summary(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_display_name text;
  v_trust_index numeric;
  v_ick_score numeric;
  v_kyc_level smallint;
  v_member_since timestamptz;
  v_last_activity_at timestamptz;
  v_rating_avg numeric;
  v_rating_count integer;
  v_contracts_completed integer;
begin
  if p_user_id is null then
    return null;
  end if;

  select display_name, trust_index, ick_score, kyc_level, created_at, updated_at
  into v_display_name, v_trust_index, v_ick_score, v_kyc_level, v_member_since, v_last_activity_at
  from public.profiles
  where id = p_user_id and deleted_at is null;

  if not found then
    return null;
  end if;

  select avg(rating)::numeric, count(*)::int
  into v_rating_avg, v_rating_count
  from public.contract_reviews
  where subject_user_id = p_user_id;

  select count(*)::int into v_contracts_completed
  from public.property_contracts
  where status = 'completed'
    and deleted_at is null
    and (client_id = p_user_id or partner_id = p_user_id or agent_id = p_user_id);

  return jsonb_build_object(
    'userId', p_user_id,
    'displayName', v_display_name,
    'trustIndex', v_trust_index,
    'ickScore', v_ick_score,
    'kycLevel', v_kyc_level,
    'memberSince', v_member_since,
    'lastActivityAt', v_last_activity_at,
    'ratingAvg', v_rating_avg,
    'ratingCount', coalesce(v_rating_count, 0),
    'contractsCompleted', coalesce(v_contracts_completed, 0)
  );
end;
$$;

revoke all on function public.get_user_trust_summary(uuid) from public;
grant execute on function public.get_user_trust_summary(uuid) to authenticated;
