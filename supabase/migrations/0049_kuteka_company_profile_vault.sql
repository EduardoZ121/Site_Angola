-- 0049_kuteka_company_profile_vault.sql
-- Institutional Kuteka bank + official contacts.
-- Separate from personal founder KYC (identity bank rows). Owner-only.
-- A second code is verified in the database (pgcrypto). Never stored in the client.

create extension if not exists pgcrypto;

create table if not exists public.kuteka_company_profile (
  id smallint primary key default 1 check (id = 1),
  bank_name text,
  iban text,
  account_number text,
  account_holder text,
  currency text not null default 'AOA',
  payment_notes text,
  phone text,
  whatsapp text,
  email text,
  address text,
  other_contacts text,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid,
  constraint kuteka_company_profile_currency_chk check (currency ~ '^[A-Z]{3}$'),
  constraint kuteka_company_profile_iban_chk check (
    iban is null or iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$'
  ),
  constraint kuteka_company_profile_email_chk check (
    email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

insert into public.kuteka_company_profile (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.kuteka_company_vault (
  id smallint primary key default 1 check (id = 1),
  code_hash text,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid
);

insert into public.kuteka_company_vault (id)
values (1)
on conflict (id) do nothing;

alter table public.kuteka_company_profile enable row level security;
alter table public.kuteka_company_vault enable row level security;

revoke all on public.kuteka_company_profile from public, anon, authenticated;
revoke all on public.kuteka_company_vault from public, anon, authenticated;
grant all on public.kuteka_company_profile to service_role;
grant all on public.kuteka_company_vault to service_role;

comment on table public.kuteka_company_profile is
  'Singleton institutional bank and official contacts. Not personal founder KYC. No direct client access.';
comment on table public.kuteka_company_vault is
  'bcrypt hash of the Founder Owner second code. Plaintext is never stored.';

-- Internal: owner + lock + code. Not granted to API roles.
create or replace function public.kuteka_company_vault_check(p_code text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_hash text;
  v_locked timestamptz;
begin
  if v_actor is null then
    raise exception 'KUTEKA_VAULT_AUTH';
  end if;
  if not public.is_platform_owner(v_actor) then
    raise exception 'KUTEKA_VAULT_FORBIDDEN';
  end if;

  select code_hash, locked_until
    into v_hash, v_locked
  from public.kuteka_company_vault
  where id = 1
  for update;

  if v_locked is not null and v_locked > timezone('utc', now()) then
    raise exception 'KUTEKA_VAULT_LOCKED';
  end if;

  if v_hash is null then
    raise exception 'KUTEKA_VAULT_UNSET';
  end if;

  if length(trim(coalesce(p_code, ''))) < 8
     or v_hash is distinct from crypt(trim(p_code), v_hash) then
    update public.kuteka_company_vault
    set
      failed_attempts = failed_attempts + 1,
      locked_until = case
        when failed_attempts + 1 >= 5 then timezone('utc', now()) + interval '15 minutes'
        else null
      end,
      updated_at = timezone('utc', now())
    where id = 1;
    raise exception 'KUTEKA_VAULT_BAD_CODE';
  end if;

  update public.kuteka_company_vault
  set failed_attempts = 0,
      locked_until = null,
      updated_at = timezone('utc', now())
  where id = 1;
end;
$$;

revoke all on function public.kuteka_company_vault_check(text) from public, anon, authenticated;

create or replace function public.founder_company_vault_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_hash text;
  v_fails integer;
  v_locked timestamptz;
begin
  if v_actor is null or not public.is_platform_owner(v_actor) then
    return jsonb_build_object('isOwner', false);
  end if;

  select code_hash, failed_attempts, locked_until
    into v_hash, v_fails, v_locked
  from public.kuteka_company_vault
  where id = 1;

  return jsonb_build_object(
    'isOwner', true,
    'codeConfigured', v_hash is not null,
    'lockedUntil', v_locked,
    'failedAttempts', coalesce(v_fails, 0)
  );
end;
$$;

create or replace function public.founder_company_vault_set_code(
  p_new_code text,
  p_current_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_hash text;
  v_locked timestamptz;
  v_new text := trim(coalesce(p_new_code, ''));
begin
  if v_actor is null then
    raise exception 'KUTEKA_VAULT_AUTH';
  end if;
  if not public.is_platform_owner(v_actor) then
    raise exception 'KUTEKA_VAULT_FORBIDDEN';
  end if;
  if length(v_new) < 8 or length(v_new) > 64 then
    raise exception 'KUTEKA_VAULT_CODE_LENGTH';
  end if;

  select code_hash, locked_until
    into v_hash, v_locked
  from public.kuteka_company_vault
  where id = 1
  for update;

  if v_locked is not null and v_locked > timezone('utc', now()) then
    raise exception 'KUTEKA_VAULT_LOCKED';
  end if;

  if v_hash is not null
     and (
       length(trim(coalesce(p_current_code, ''))) < 8
       or v_hash is distinct from crypt(trim(p_current_code), v_hash)
     ) then
    update public.kuteka_company_vault
    set
      failed_attempts = failed_attempts + 1,
      locked_until = case
        when failed_attempts + 1 >= 5 then timezone('utc', now()) + interval '15 minutes'
        else null
      end,
      updated_at = timezone('utc', now())
    where id = 1;
    raise exception 'KUTEKA_VAULT_BAD_CODE';
  end if;

  update public.kuteka_company_vault
  set
    code_hash = crypt(v_new, gen_salt('bf')),
    failed_attempts = 0,
    locked_until = null,
    updated_at = timezone('utc', now()),
    updated_by = v_actor
  where id = 1;

  perform public.write_audit_log(
    'company_vault.set_code',
    'kuteka_company_vault',
    '1',
    jsonb_build_object('rotated', v_hash is not null)
  );

  return jsonb_build_object('ok', true, 'codeConfigured', true);
end;
$$;

create or replace function public.founder_company_profile_read(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.kuteka_company_profile;
begin
  perform public.kuteka_company_vault_check(p_code);

  select * into v_row from public.kuteka_company_profile where id = 1;

  perform public.write_audit_log(
    'company_profile.read',
    'kuteka_company_profile',
    '1',
    '{}'::jsonb
  );

  return jsonb_build_object(
    'bankName', v_row.bank_name,
    'iban', v_row.iban,
    'accountNumber', v_row.account_number,
    'accountHolder', v_row.account_holder,
    'currency', v_row.currency,
    'paymentNotes', v_row.payment_notes,
    'phone', v_row.phone,
    'whatsapp', v_row.whatsapp,
    'email', v_row.email,
    'address', v_row.address,
    'otherContacts', v_row.other_contacts,
    'updatedAt', v_row.updated_at
  );
end;
$$;

create or replace function public.founder_company_profile_update(
  p_code text,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_bank text;
  v_iban text;
  v_account text;
  v_holder text;
  v_currency text;
  v_notes text;
  v_phone text;
  v_whatsapp text;
  v_email text;
  v_address text;
  v_other text;
  v_row public.kuteka_company_profile;
begin
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'KUTEKA_VAULT_FIELD';
  end if;

  perform public.kuteka_company_vault_check(p_code);

  v_bank := nullif(left(trim(coalesce(p_patch->>'bankName', '')), 80), '');
  v_iban := nullif(upper(regexp_replace(coalesce(p_patch->>'iban', ''), '\s', '', 'g')), '');
  v_account := nullif(left(trim(coalesce(p_patch->>'accountNumber', '')), 34), '');
  v_holder := nullif(left(trim(coalesce(p_patch->>'accountHolder', '')), 120), '');
  v_currency := coalesce(nullif(upper(left(trim(coalesce(p_patch->>'currency', '')), 3)), ''), 'AOA');
  v_notes := nullif(left(trim(coalesce(p_patch->>'paymentNotes', '')), 500), '');
  v_phone := nullif(left(trim(coalesce(p_patch->>'phone', '')), 32), '');
  v_whatsapp := nullif(left(trim(coalesce(p_patch->>'whatsapp', '')), 32), '');
  v_email := nullif(lower(left(trim(coalesce(p_patch->>'email', '')), 120)), '');
  v_address := nullif(left(trim(coalesce(p_patch->>'address', '')), 240), '');
  v_other := nullif(left(trim(coalesce(p_patch->>'otherContacts', '')), 500), '');

  if v_iban is not null and v_iban !~ '^[A-Z]{2}[0-9A-Z]{13,32}$' then
    raise exception 'KUTEKA_VAULT_IBAN';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'KUTEKA_VAULT_FIELD';
  end if;
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'KUTEKA_VAULT_EMAIL';
  end if;

  update public.kuteka_company_profile
  set
    bank_name = v_bank,
    iban = v_iban,
    account_number = v_account,
    account_holder = v_holder,
    currency = v_currency,
    payment_notes = v_notes,
    phone = v_phone,
    whatsapp = v_whatsapp,
    email = v_email,
    address = v_address,
    other_contacts = v_other,
    updated_at = timezone('utc', now()),
    updated_by = v_actor
  where id = 1
  returning * into v_row;

  perform public.write_audit_log(
    'company_profile.update',
    'kuteka_company_profile',
    '1',
    jsonb_build_object(
      'fields',
      (
        select coalesce(jsonb_agg(k), '[]'::jsonb)
        from jsonb_object_keys(p_patch) as k
      )
    )
  );

  return jsonb_build_object(
    'bankName', v_row.bank_name,
    'iban', v_row.iban,
    'accountNumber', v_row.account_number,
    'accountHolder', v_row.account_holder,
    'currency', v_row.currency,
    'paymentNotes', v_row.payment_notes,
    'phone', v_row.phone,
    'whatsapp', v_row.whatsapp,
    'email', v_row.email,
    'address', v_row.address,
    'otherContacts', v_row.other_contacts,
    'updatedAt', v_row.updated_at
  );
end;
$$;

revoke all on function public.founder_company_vault_status() from public;
revoke all on function public.founder_company_vault_set_code(text, text) from public;
revoke all on function public.founder_company_profile_read(text) from public;
revoke all on function public.founder_company_profile_update(text, jsonb) from public;

grant execute on function public.founder_company_vault_status() to authenticated;
grant execute on function public.founder_company_vault_set_code(text, text) to authenticated;
grant execute on function public.founder_company_profile_read(text) to authenticated;
grant execute on function public.founder_company_profile_update(text, jsonb) to authenticated;

comment on function public.founder_company_profile_read(text) is
  'Owner-only read of institutional bank and contacts. Requires the vault code. Audited. No personal KYC.';
