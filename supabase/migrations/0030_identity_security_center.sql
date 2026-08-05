-- 0030_identity_security_center.sql
-- ADR-026: OTP challenges, devices, sessions audit, recovery codes, security snapshot.
-- SMS/2FA providers may stay sandbox; schema is production-ready.

begin;

create extension if not exists "pgcrypto";

-- ─── Account security preferences ───────────────────────────────────────────
alter table public.profiles
  add column if not exists email_verified_at timestamptz,
  add column if not exists security_score integer not null default 0
    check (security_score >= 0 and security_score <= 100),
  add column if not exists mfa_enabled boolean not null default false,
  add column if not exists mfa_enrolled_at timestamptz,
  add column if not exists last_login_at timestamptz,
  add column if not exists last_login_ip text,
  add column if not exists last_login_user_agent text;

comment on column public.profiles.email_verified_at is
  'App-side email confirmation (OTP path). Supabase auth.users.email_confirmed_at remains source for link path.';
comment on column public.profiles.security_score is
  'Derived account security score (0–100) for Centro de Segurança.';

-- ─── OTP challenges (email / sms / step-up) ─────────────────────────────────
create table if not exists public.security_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  channel text not null check (channel in ('email', 'sms')),
  purpose text not null check (
    purpose in (
      'signup',
      'login',
      'recovery',
      'sensitive_change',
      'phone_verify',
      'email_verify',
      'step_up'
    )
  ),
  destination text not null,
  code_hash text not null,
  attempts integer not null default 0,
  max_attempts integer not null default 5,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  provider text not null default 'sandbox'
    check (provider in ('supabase_auth', 'sandbox', 'twilio', 'messagebird', 'infobip', 'other')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_otp_challenges_user_idx
  on public.security_otp_challenges (user_id, purpose, created_at desc);
create index if not exists security_otp_challenges_dest_idx
  on public.security_otp_challenges (destination, purpose, created_at desc);

alter table public.security_otp_challenges enable row level security;

drop policy if exists security_otp_challenges_select_own on public.security_otp_challenges;
create policy security_otp_challenges_select_own
  on public.security_otp_challenges for select to authenticated
  using (user_id = auth.uid());

-- ─── Trusted devices (prepared) ─────────────────────────────────────────────
create table if not exists public.security_trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  device_key text not null,
  label text,
  user_agent text,
  platform text,
  last_ip text,
  trusted_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  unique (user_id, device_key)
);

create index if not exists security_trusted_devices_user_idx
  on public.security_trusted_devices (user_id, revoked_at nulls first);

alter table public.security_trusted_devices enable row level security;

drop policy if exists security_trusted_devices_own on public.security_trusted_devices;
create policy security_trusted_devices_own
  on public.security_trusted_devices for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Session inventory (prepared for remote revoke) ─────────────────────────
create table if not exists public.security_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_key text not null,
  device_id uuid references public.security_trusted_devices (id) on delete set null,
  ip text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  last_seen_at timestamptz not null default timezone('utc', now()),
  revoked_at timestamptz,
  unique (user_id, session_key)
);

create index if not exists security_sessions_user_idx
  on public.security_sessions (user_id, revoked_at nulls first, last_seen_at desc);

alter table public.security_sessions enable row level security;

drop policy if exists security_sessions_own on public.security_sessions;
create policy security_sessions_own
  on public.security_sessions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Auth / security event log ──────────────────────────────────────────────
create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  severity text not null default 'info'
    check (severity in ('info', 'notice', 'warning', 'critical')),
  channel text,
  ip text,
  user_agent text,
  device_id uuid references public.security_trusted_devices (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  notify boolean not null default false,
  notified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_events_user_idx
  on public.security_events (user_id, created_at desc);
create index if not exists security_events_type_idx
  on public.security_events (event_type, created_at desc);
create index if not exists security_events_notify_idx
  on public.security_events (notify, notified_at)
  where notify = true and notified_at is null;

alter table public.security_events enable row level security;

drop policy if exists security_events_select_own on public.security_events;
create policy security_events_select_own
  on public.security_events for select to authenticated
  using (user_id = auth.uid());

-- ─── Recovery codes (hashed; prepared for 2FA) ──────────────────────────────
create table if not exists public.security_recovery_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_recovery_codes_user_idx
  on public.security_recovery_codes (user_id) where used_at is null;

alter table public.security_recovery_codes enable row level security;

drop policy if exists security_recovery_codes_select_own on public.security_recovery_codes;
create policy security_recovery_codes_select_own
  on public.security_recovery_codes for select to authenticated
  using (user_id = auth.uid());

-- ─── Feature flags (security) ───────────────────────────────────────────────
insert into public.platform_feature_flags (code, label, description, enabled, metadata)
values
  (
    'security.email_otp',
    'OTP email',
    'Código de 6 dígitos por email, em paralelo com o link de confirmação',
    true,
    '{"note":"6-digit email OTP alongside link"}'::jsonb
  ),
  (
    'security.sms_otp',
    'OTP SMS',
    'Verificação e recuperação por SMS (sandbox até fornecedor Angola)',
    false,
    '{"note":"sandbox ready; enable when provider live"}'::jsonb
  ),
  (
    'security.mfa_totp',
    '2FA TOTP',
    'Autenticação em dois factores (preparado)',
    false,
    '{"note":"prepared"}'::jsonb
  ),
  (
    'security.mfa_required_for_admin',
    '2FA obrigatório admin',
    'Super/Admin exigem MFA quando activo',
    false,
    '{"note":"super/admin step-up"}'::jsonb
  ),
  (
    'security.trusted_devices',
    'Dispositivos confiáveis',
    'Gestão de dispositivos confiáveis (preparado)',
    false,
    '{"note":"prepared"}'::jsonb
  ),
  (
    'security.remote_session_revoke',
    'Revogar sessões',
    'Terminar sessões remotamente (preparado)',
    false,
    '{"note":"prepared"}'::jsonb
  )
on conflict (code) do update
set
  label = excluded.label,
  description = excluded.description,
  metadata = excluded.metadata;

-- ─── Helpers ────────────────────────────────────────────────────────────────
create or replace function public.security_hash_otp(p_code text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(digest(convert_to(trim(p_code), 'utf8'), 'sha256'), 'hex');
$$;

create or replace function public.security_record_event(
  p_user_id uuid,
  p_event_type text,
  p_severity text default 'info',
  p_channel text default null,
  p_payload jsonb default '{}'::jsonb,
  p_notify boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.security_events (user_id, event_type, severity, channel, payload, notify)
  values (
    p_user_id,
    p_event_type,
    coalesce(nullif(p_severity, ''), 'info'),
    p_channel,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_notify, false)
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.security_record_event(uuid, text, text, text, jsonb, boolean) from public;
grant execute on function public.security_record_event(uuid, text, text, text, jsonb, boolean) to authenticated, service_role;

-- Sandbox SMS / custom OTP issue (returns plaintext code only in sandbox meta for demos)
create or replace function public.security_issue_otp(
  p_channel text,
  p_purpose text,
  p_destination text,
  p_user_id uuid default null,
  p_ttl_seconds integer default 600
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_user uuid := coalesce(p_user_id, v_actor);
  v_code text;
  v_id uuid;
begin
  if p_channel not in ('email', 'sms') then
    raise exception 'invalid channel';
  end if;
  if p_purpose is null or length(trim(p_destination)) < 3 then
    raise exception 'invalid destination';
  end if;

  -- Expire prior pending challenges for same destination+purpose
  update public.security_otp_challenges
  set consumed_at = timezone('utc', now()),
      meta = coalesce(meta, '{}'::jsonb) || '{"superseded":true}'::jsonb
  where destination = lower(trim(p_destination))
    and purpose = p_purpose
    and consumed_at is null
    and expires_at > timezone('utc', now());

  v_code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  insert into public.security_otp_challenges (
    user_id, channel, purpose, destination, code_hash, expires_at, provider, meta
  ) values (
    v_user,
    p_channel,
    p_purpose,
    lower(trim(p_destination)),
    public.security_hash_otp(v_code),
    timezone('utc', now()) + make_interval(secs => greatest(coalesce(p_ttl_seconds, 600), 60)),
    'sandbox',
    jsonb_build_object('sandbox_code', v_code)
  )
  returning id into v_id;

  perform public.security_record_event(
    v_user,
    'otp_issued',
    'info',
    p_channel,
    jsonb_build_object('purpose', p_purpose, 'challenge_id', v_id),
    false
  );

  return jsonb_build_object(
    'ok', true,
    'challengeId', v_id,
    'channel', p_channel,
    'purpose', p_purpose,
    'expiresInSeconds', greatest(coalesce(p_ttl_seconds, 600), 60),
    'sandboxCode', v_code,
    'provider', 'sandbox'
  );
end;
$$;

revoke all on function public.security_issue_otp(text, text, text, uuid, integer) from public;
grant execute on function public.security_issue_otp(text, text, text, uuid, integer) to authenticated, service_role, anon;

create or replace function public.security_verify_otp(
  p_challenge_id uuid,
  p_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.security_otp_challenges%rowtype;
  v_actor uuid := auth.uid();
begin
  select * into v_row
  from public.security_otp_challenges
  where id = p_challenge_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'challenge_not_found');
  end if;

  if v_row.user_id is not null and v_actor is not null and v_row.user_id <> v_actor then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if v_row.consumed_at is not null then
    return jsonb_build_object('ok', false, 'error', 'already_used');
  end if;

  if v_row.expires_at < timezone('utc', now()) then
    return jsonb_build_object('ok', false, 'error', 'expired');
  end if;

  if v_row.attempts >= v_row.max_attempts then
    return jsonb_build_object('ok', false, 'error', 'too_many_attempts');
  end if;

  update public.security_otp_challenges
  set attempts = attempts + 1
  where id = v_row.id;

  if public.security_hash_otp(p_code) <> v_row.code_hash then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  update public.security_otp_challenges
  set consumed_at = timezone('utc', now())
  where id = v_row.id;

  if v_row.purpose in ('phone_verify', 'recovery') and v_row.channel = 'sms' and v_row.user_id is not null then
    update public.profiles
    set phone_verified_at = timezone('utc', now()),
        phone_primary = coalesce(nullif(phone_primary, ''), v_row.destination)
    where id = v_row.user_id;
  end if;

  if v_row.purpose in ('email_verify', 'signup') and v_row.channel = 'email' and v_row.user_id is not null then
    update public.profiles
    set email_verified_at = coalesce(email_verified_at, timezone('utc', now()))
    where id = v_row.user_id;
  end if;

  perform public.security_record_event(
    v_row.user_id,
    'otp_verified',
    'notice',
    v_row.channel,
    jsonb_build_object('purpose', v_row.purpose, 'challenge_id', v_row.id),
    true
  );

  return jsonb_build_object(
    'ok', true,
    'purpose', v_row.purpose,
    'channel', v_row.channel,
    'destination', v_row.destination,
    'recoveryReady', v_row.purpose = 'recovery'
  );
end;
$$;

revoke all on function public.security_verify_otp(uuid, text) from public;
grant execute on function public.security_verify_otp(uuid, text) to authenticated, service_role, anon;

create or replace function public.security_compute_score(p_user_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_score integer := 0;
  v_email_ok boolean := false;
  v_phone_ok boolean := false;
  v_kyc integer := 0;
  v_mfa boolean := false;
begin
  select
    (u.email_confirmed_at is not null)
    or exists (
      select 1 from public.profiles p2
      where p2.id = p_user_id and p2.email_verified_at is not null
    )
  into v_email_ok
  from auth.users u where u.id = p_user_id;

  select
    p.phone_verified_at is not null,
    coalesce(p.kyc_level, 0),
    coalesce(p.mfa_enabled, false)
  into v_phone_ok, v_kyc, v_mfa
  from public.profiles p
  where p.id = p_user_id;

  if v_email_ok then v_score := v_score + 25; end if;
  if v_phone_ok then v_score := v_score + 25; end if;
  if v_kyc >= 2 then v_score := v_score + 20; end if;
  if v_kyc >= 4 then v_score := v_score + 10; end if;
  if v_mfa then v_score := v_score + 20; end if;

  return least(100, v_score);
end;
$$;

-- Admin / Super Admin minimum security posture (email + phone; MFA when flagged)
create or replace function public.security_admin_posture_ok(p_user_id uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email_ok boolean := false;
  v_phone_ok boolean := false;
  v_mfa boolean := false;
  v_mfa_required boolean := false;
begin
  if p_user_id is null then
    return false;
  end if;

  select
    (u.email_confirmed_at is not null)
    or exists (
      select 1 from public.profiles p2
      where p2.id = p_user_id and p2.email_verified_at is not null
    )
  into v_email_ok
  from auth.users u where u.id = p_user_id;

  select
    p.phone_verified_at is not null,
    coalesce(p.mfa_enabled, false)
  into v_phone_ok, v_mfa
  from public.profiles p
  where p.id = p_user_id;

  select coalesce(enabled, false) into v_mfa_required
  from public.platform_feature_flags
  where code = 'security.mfa_required_for_admin';

  if not coalesce(v_email_ok, false) then return false; end if;
  if not coalesce(v_phone_ok, false) then return false; end if;
  if v_mfa_required and not coalesce(v_mfa, false) then return false; end if;
  return true;
end;
$$;

revoke all on function public.security_admin_posture_ok(uuid) from public;
grant execute on function public.security_admin_posture_ok(uuid) to authenticated;

create or replace function public.security_revoke_session(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_flag boolean := false;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'authentication required');
  end if;

  select coalesce(enabled, false) into v_flag
  from public.platform_feature_flags
  where code = 'security.remote_session_revoke';

  update public.security_sessions
  set revoked_at = timezone('utc', now())
  where id = p_session_id
    and user_id = v_uid
    and revoked_at is null;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  perform public.security_record_event(
    v_uid,
    'session_revoked',
    'notice',
    null,
    jsonb_build_object('session_id', p_session_id, 'flag_enabled', v_flag),
    true
  );

  return jsonb_build_object('ok', true, 'sessionId', p_session_id, 'enforced', v_flag);
end;
$$;

revoke all on function public.security_revoke_session(uuid) from public;
grant execute on function public.security_revoke_session(uuid) to authenticated;

create or replace function public.get_security_center_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_email_ok boolean := false;
  v_phone text;
  v_phone_ok boolean := false;
  v_kyc integer := 0;
  v_last_login timestamptz;
  v_mfa boolean := false;
  v_score integer := 0;
  v_devices jsonb := '[]'::jsonb;
  v_sessions jsonb := '[]'::jsonb;
  v_events jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  select
    u.email,
    (u.email_confirmed_at is not null)
  into v_email, v_email_ok
  from auth.users u where u.id = v_uid;

  select
    p.phone_primary,
    p.phone_verified_at is not null,
    coalesce(p.kyc_level, 0),
    p.last_login_at,
    coalesce(p.mfa_enabled, false),
    (v_email_ok or p.email_verified_at is not null)
  into v_phone, v_phone_ok, v_kyc, v_last_login, v_mfa, v_email_ok
  from public.profiles p
  where p.id = v_uid;

  v_score := public.security_compute_score(v_uid);

  update public.profiles
  set security_score = v_score
  where id = v_uid;

  select coalesce(jsonb_agg(to_jsonb(d) order by d.last_seen_at desc), '[]'::jsonb)
  into v_devices
  from (
    select id, label, platform, last_ip, trusted_at, last_seen_at, revoked_at
    from public.security_trusted_devices
    where user_id = v_uid
    order by last_seen_at desc
    limit 20
  ) d;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.last_seen_at desc), '[]'::jsonb)
  into v_sessions
  from (
    select id, session_key, ip, user_agent, created_at, last_seen_at, revoked_at
    from public.security_sessions
    where user_id = v_uid
    order by last_seen_at desc
    limit 20
  ) s;

  select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb)
  into v_events
  from (
    select id, event_type, severity, channel, created_at, payload, notify
    from public.security_events
    where user_id = v_uid
    order by created_at desc
    limit 30
  ) e;

  return jsonb_build_object(
    'email', v_email,
    'emailVerified', v_email_ok,
    'phone', v_phone,
    'phoneVerified', v_phone_ok,
    'kycLevel', v_kyc,
    'mfaEnabled', v_mfa,
    'lastLoginAt', v_last_login,
    'securityScore', v_score,
    'adminPostureOk', public.security_admin_posture_ok(v_uid),
    'devices', v_devices,
    'sessions', v_sessions,
    'recentEvents', v_events,
    'flags', jsonb_build_object(
      'emailOtp', true,
      'smsOtpPrepared', true,
      'mfaPrepared', true,
      'trustedDevicesPrepared', true,
      'remoteRevokePrepared', true
    )
  );
end;
$$;

revoke all on function public.get_security_center_snapshot() from public;
grant execute on function public.get_security_center_snapshot() to authenticated;

commit;
