-- PRD-009 / ADR-014: Identidade Real (KYC) — perfil completo, documentos, níveis, snapshot contratual
-- Additive: não reabre Core V1; estende profiles + Confiança.

-- ─── Profiles: identidade pessoal, contactos, KYC ───────────────────────────

alter table public.profiles
  add column if not exists legal_full_name text,
  add column if not exists preferred_name text,
  add column if not exists sex text
    check (sex is null or sex in ('female', 'male', 'other', 'undisclosed')),
  add column if not exists birth_date date,
  add column if not exists nationality text,
  add column if not exists place_of_birth text,
  add column if not exists marital_status text
    check (
      marital_status is null
      or marital_status in (
        'single', 'married', 'de_facto', 'divorced', 'widowed', 'undisclosed'
      )
    ),
  add column if not exists phone_primary text,
  add column if not exists phone_secondary text,
  add column if not exists email_secondary text,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists selfie_url text,
  add column if not exists kyc_level smallint not null default 0
    check (kyc_level between 0 and 4),
  add column if not exists kyc_identity_status text not null default 'missing'
    check (kyc_identity_status in ('missing', 'pending', 'verified', 'rejected')),
  add column if not exists kyc_document_status text not null default 'missing'
    check (kyc_document_status in ('missing', 'pending', 'verified', 'rejected')),
  add column if not exists kyc_address_status text not null default 'missing'
    check (kyc_address_status in ('missing', 'pending', 'verified', 'rejected')),
  add column if not exists kyc_banking_status text not null default 'missing'
    check (kyc_banking_status in ('missing', 'pending', 'verified', 'rejected')),
  add column if not exists trust_index numeric(5, 2) not null default 0
    check (trust_index >= 0 and trust_index <= 100),
  add column if not exists identity_updated_at timestamptz;

comment on column public.profiles.legal_full_name is
  'Nome completo conforme documento de identificação.';
comment on column public.profiles.kyc_level is
  '0 conta · 1 contactos · 2 documento · 3 identidade Kuteka · 4 premium.';

-- ─── Endereço ───────────────────────────────────────────────────────────────

create table if not exists public.identity_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  country text not null default 'AO',
  province text,
  municipality text,
  commune text,
  neighborhood text,
  street text,
  number text,
  postal_code text,
  gps_lat numeric(10, 7),
  gps_lng numeric(10, 7),
  verification_status text not null default 'draft'
    check (verification_status in ('draft', 'submitted', 'verified', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

drop trigger if exists identity_addresses_set_updated_at on public.identity_addresses;
create trigger identity_addresses_set_updated_at
before update on public.identity_addresses
for each row execute function public.set_updated_at();

alter table public.identity_addresses enable row level security;

drop policy if exists identity_addresses_select_own on public.identity_addresses;
create policy identity_addresses_select_own
  on public.identity_addresses for select to authenticated
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
      or public.user_has_permission(auth.uid(), 'agent.operate')
    )
  );

drop policy if exists identity_addresses_upsert_own on public.identity_addresses;
create policy identity_addresses_insert_own
  on public.identity_addresses for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists identity_addresses_update_own on public.identity_addresses;
create policy identity_addresses_update_own
  on public.identity_addresses for update to authenticated
  using (deleted_at is null and user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Dados bancários (opcional) ─────────────────────────────────────────────

create table if not exists public.identity_banking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  bank_name text,
  iban text,
  account_number text,
  account_holder_name text,
  digital_wallets jsonb not null default '[]'::jsonb,
  verification_status text not null default 'draft'
    check (verification_status in ('draft', 'submitted', 'verified', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

drop trigger if exists identity_banking_set_updated_at on public.identity_banking;
create trigger identity_banking_set_updated_at
before update on public.identity_banking
for each row execute function public.set_updated_at();

alter table public.identity_banking enable row level security;

drop policy if exists identity_banking_select_own on public.identity_banking;
create policy identity_banking_select_own
  on public.identity_banking for select to authenticated
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
    )
  );

drop policy if exists identity_banking_insert_own on public.identity_banking;
create policy identity_banking_insert_own
  on public.identity_banking for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists identity_banking_update_own on public.identity_banking;
create policy identity_banking_update_own
  on public.identity_banking for update to authenticated
  using (deleted_at is null and user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── Documento de identificação (frente/verso) ──────────────────────────────

create table if not exists public.identity_id_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_kind text not null
    check (doc_kind in ('bi', 'passport', 'residence_card', 'other')),
  doc_number text not null,
  issued_on date,
  expires_on date,
  issued_at text,
  issuing_country text not null default 'AO',
  front_storage_path text,
  back_storage_path text,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'accepted', 'rejected', 'expired')),
  rejection_reason text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  trust_document_id uuid references public.trust_documents (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists identity_id_documents_user_id_idx
  on public.identity_id_documents (user_id)
  where deleted_at is null;

create index if not exists identity_id_documents_status_idx
  on public.identity_id_documents (status)
  where deleted_at is null;

drop trigger if exists identity_id_documents_set_updated_at on public.identity_id_documents;
create trigger identity_id_documents_set_updated_at
before update on public.identity_id_documents
for each row execute function public.set_updated_at();

alter table public.identity_id_documents enable row level security;

drop policy if exists identity_id_documents_select_own on public.identity_id_documents;
create policy identity_id_documents_select_own
  on public.identity_id_documents for select to authenticated
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
      or public.user_has_permission(auth.uid(), 'agent.operate')
    )
  );

drop policy if exists identity_id_documents_insert_own on public.identity_id_documents;
create policy identity_id_documents_insert_own
  on public.identity_id_documents for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists identity_id_documents_update_own on public.identity_id_documents;
create policy identity_id_documents_update_own
  on public.identity_id_documents for update to authenticated
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
    )
  )
  with check (
    user_id = auth.uid()
    or public.user_has_permission(auth.uid(), 'admin.panel')
  );

-- Extend trust_documents with storage paths (optional linkage)
alter table public.trust_documents
  add column if not exists front_storage_path text,
  add column if not exists back_storage_path text,
  add column if not exists id_document_id uuid;

-- ─── Storage privado para documentos de identidade ──────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'identity-documents',
  'identity-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Avatars: allow authenticated upload under own folder
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists identity_documents_storage_select on storage.objects;
create policy identity_documents_storage_select
  on storage.objects for select to authenticated
  using (
    bucket_id = 'identity-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.user_has_permission(auth.uid(), 'admin.panel')
      or public.user_has_permission(auth.uid(), 'agent.operate')
    )
  );

drop policy if exists identity_documents_storage_insert on storage.objects;
create policy identity_documents_storage_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'identity-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists identity_documents_storage_update on storage.objects;
create policy identity_documents_storage_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'identity-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.user_has_permission(auth.uid(), 'admin.panel')
    )
  );

drop policy if exists avatars_storage_select on storage.objects;
create policy avatars_storage_select
  on storage.objects for select to public
  using (bucket_id = 'avatars');

drop policy if exists avatars_storage_insert on storage.objects;
create policy avatars_storage_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatars_storage_update on storage.objects;
create policy avatars_storage_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─── Auditoria de consulta a documentos sensíveis ───────────────────────────

create table if not exists public.identity_access_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  subject_user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists identity_access_logs_subject_idx
  on public.identity_access_logs (subject_user_id, created_at desc);

alter table public.identity_access_logs enable row level security;

drop policy if exists identity_access_logs_admin on public.identity_access_logs;
create policy identity_access_logs_admin
  on public.identity_access_logs for select to authenticated
  using (
    public.user_has_permission(auth.uid(), 'admin.panel')
    or actor_id = auth.uid()
    or subject_user_id = auth.uid()
  );

drop policy if exists identity_access_logs_insert on public.identity_access_logs;
create policy identity_access_logs_insert
  on public.identity_access_logs for insert to authenticated
  with check (actor_id = auth.uid());

-- ─── Recompute KYC level + trust index ──────────────────────────────────────

create or replace function public.recompute_profile_kyc(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_email_confirmed boolean := false;
  v_phone_ok boolean := false;
  v_identity_ok boolean := false;
  v_doc_status text := 'missing';
  v_addr_status text := 'missing';
  v_bank_status text := 'missing';
  v_level smallint := 0;
  v_index numeric(5, 2) := 0;
  v_has_personal boolean := false;
begin
  select * into v_profile
  from public.profiles
  where id = p_user_id and deleted_at is null;

  if not found then
    return;
  end if;

  select coalesce(u.email_confirmed_at is not null, false)
  into v_email_confirmed
  from auth.users u
  where u.id = p_user_id;

  v_phone_ok := v_profile.phone_primary is not null
    and length(trim(v_profile.phone_primary)) >= 8
    and v_profile.phone_verified_at is not null;

  v_has_personal :=
    v_profile.legal_full_name is not null
    and length(trim(v_profile.legal_full_name)) >= 3
    and v_profile.birth_date is not null
    and v_profile.nationality is not null
    and length(trim(v_profile.nationality)) >= 2;

  select coalesce(
    (
      select case
        when d.status = 'accepted' then 'verified'
        when d.status in ('submitted', 'under_review') then 'pending'
        when d.status = 'rejected' then 'rejected'
        when d.status = 'expired' then 'rejected'
        else 'missing'
      end
      from public.identity_id_documents d
      where d.user_id = p_user_id
        and d.deleted_at is null
      order by
        case d.status
          when 'accepted' then 0
          when 'under_review' then 1
          when 'submitted' then 2
          when 'rejected' then 3
          else 4
        end,
        d.created_at desc
      limit 1
    ),
    'missing'
  )
  into v_doc_status;

  select coalesce(
    (
      select case a.verification_status
        when 'verified' then 'verified'
        when 'submitted' then 'pending'
        when 'rejected' then 'rejected'
        else 'missing'
      end
      from public.identity_addresses a
      where a.user_id = p_user_id
        and a.deleted_at is null
      limit 1
    ),
    'missing'
  )
  into v_addr_status;

  -- Address with province+municipality counts as present even if draft
  if v_addr_status = 'missing' and exists (
    select 1
    from public.identity_addresses a
    where a.user_id = p_user_id
      and a.deleted_at is null
      and a.province is not null
      and a.municipality is not null
  ) then
    v_addr_status := 'pending';
  end if;

  select coalesce(
    (
      select case b.verification_status
        when 'verified' then 'verified'
        when 'submitted' then 'pending'
        when 'rejected' then 'rejected'
        else 'missing'
      end
      from public.identity_banking b
      where b.user_id = p_user_id
        and b.deleted_at is null
        and (
          b.iban is not null
          or b.account_number is not null
          or jsonb_array_length(coalesce(b.digital_wallets, '[]'::jsonb)) > 0
        )
      limit 1
    ),
    'missing'
  )
  into v_bank_status;

  v_identity_ok := v_has_personal and v_doc_status = 'verified';

  -- Levels
  v_level := 0;
  if v_email_confirmed and v_phone_ok then
    v_level := 1;
  elsif v_email_confirmed then
    v_level := 1; -- email alone unlocks contact level (phone can lag)
  end if;

  if v_doc_status = 'verified' then
    v_level := greatest(v_level, 2);
  end if;

  if v_identity_ok and v_addr_status in ('pending', 'verified') then
    v_level := greatest(v_level, 3);
  end if;

  if v_level >= 3
     and v_addr_status = 'verified'
     and v_bank_status in ('pending', 'verified') then
    v_level := 4;
  end if;

  -- Trust index 0–100
  v_index := 0;
  if v_email_confirmed then v_index := v_index + 15; end if;
  if v_phone_ok then v_index := v_index + 15; end if;
  if v_has_personal then v_index := v_index + 20; end if;
  if v_doc_status = 'pending' then v_index := v_index + 10; end if;
  if v_doc_status = 'verified' then v_index := v_index + 25; end if;
  if v_addr_status = 'pending' then v_index := v_index + 5; end if;
  if v_addr_status = 'verified' then v_index := v_index + 15; end if;
  if v_bank_status = 'pending' then v_index := v_index + 3; end if;
  if v_bank_status = 'verified' then v_index := v_index + 10; end if;
  if v_profile.avatar_url is not null then v_index := v_index + 5; end if;
  if v_index > 100 then v_index := 100; end if;

  update public.profiles
  set kyc_level = v_level,
      kyc_identity_status = case
        when v_identity_ok then 'verified'
        when v_has_personal and v_doc_status = 'pending' then 'pending'
        when v_has_personal then 'pending'
        else 'missing'
      end,
      kyc_document_status = v_doc_status,
      kyc_address_status = v_addr_status,
      kyc_banking_status = v_bank_status,
      trust_index = v_index,
      identity_updated_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = p_user_id;
end;
$$;

revoke all on function public.recompute_profile_kyc(uuid) from public;
grant execute on function public.recompute_profile_kyc(uuid) to authenticated;

-- Hook: after trust review, sync identity doc + recompute
create or replace function public.review_trust_document(
  p_document_id uuid,
  p_status text,
  p_rejection_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_user_id uuid;
  v_doc_type text;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.user_has_permission(v_actor, 'admin.panel') then
    raise exception 'admin.panel required';
  end if;

  if p_status not in ('accepted', 'rejected', 'under_review') then
    raise exception 'invalid review status';
  end if;

  if p_status = 'rejected' and (p_rejection_reason is null or length(trim(p_rejection_reason)) = 0) then
    raise exception 'rejection reason required';
  end if;

  update public.trust_documents
  set status = p_status,
      rejection_reason = case when p_status = 'rejected' then trim(p_rejection_reason) else null end,
      reviewed_by = v_actor,
      reviewed_at = timezone('utc', now()),
      updated_by = v_actor
  where id = p_document_id
    and deleted_at is null
  returning user_id, doc_type into v_user_id, v_doc_type;

  if not found then
    raise exception 'document not found';
  end if;

  if v_doc_type = 'identity' then
    update public.identity_id_documents
    set status = case
          when p_status = 'accepted' then 'accepted'
          when p_status = 'rejected' then 'rejected'
          else 'under_review'
        end,
        rejection_reason = case when p_status = 'rejected' then trim(p_rejection_reason) else null end,
        reviewed_by = v_actor,
        reviewed_at = timezone('utc', now()),
        updated_by = v_actor
    where trust_document_id = p_document_id
      and deleted_at is null;
  end if;

  if v_doc_type = 'proof_of_address' and p_status = 'accepted' then
    update public.identity_addresses
    set verification_status = 'verified',
        updated_by = v_actor
    where user_id = v_user_id
      and deleted_at is null;
  end if;

  perform public.recompute_profile_kyc(v_user_id);

  perform public.write_audit_log(
    'trust.document_reviewed',
    'trust_document',
    p_document_id::text,
    jsonb_build_object('status', p_status, 'user_id', v_user_id)
  );
end;
$$;

revoke all on function public.review_trust_document(uuid, text, text) from public;
grant execute on function public.review_trust_document(uuid, text, text) to authenticated;

-- Snapshot for contracts / facturação / assinaturas
create or replace function public.get_identity_party_snapshot(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_addr public.identity_addresses%rowtype;
  v_doc public.identity_id_documents%rowtype;
  v_email text;
  v_email_confirmed boolean := false;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if v_actor is distinct from p_user_id
     and not public.user_has_permission(v_actor, 'admin.panel')
     and not public.user_has_permission(v_actor, 'contracts.manage')
     and not public.user_has_permission(v_actor, 'agent.operate') then
    raise exception 'forbidden';
  end if;

  select * into v_profile
  from public.profiles
  where id = p_user_id and deleted_at is null;

  if not found then
    return null;
  end if;

  select u.email, u.email_confirmed_at is not null
  into v_email, v_email_confirmed
  from auth.users u
  where u.id = p_user_id;

  select * into v_addr
  from public.identity_addresses
  where user_id = p_user_id and deleted_at is null
  limit 1;

  select * into v_doc
  from public.identity_id_documents
  where user_id = p_user_id and deleted_at is null
  order by
    case status when 'accepted' then 0 when 'under_review' then 1 when 'submitted' then 2 else 3 end,
    created_at desc
  limit 1;

  insert into public.identity_access_logs (actor_id, subject_user_id, action, entity_type, entity_id)
  values (v_actor, p_user_id, 'identity.snapshot_read', 'profile', p_user_id::text);

  return jsonb_build_object(
    'userId', p_user_id,
    'legalFullName', v_profile.legal_full_name,
    'preferredName', coalesce(v_profile.preferred_name, v_profile.display_name),
    'displayName', v_profile.display_name,
    'sex', v_profile.sex,
    'birthDate', v_profile.birth_date,
    'nationality', v_profile.nationality,
    'placeOfBirth', v_profile.place_of_birth,
    'maritalStatus', v_profile.marital_status,
    'email', v_email,
    'emailConfirmed', v_email_confirmed,
    'emailSecondary', v_profile.email_secondary,
    'phonePrimary', v_profile.phone_primary,
    'phoneSecondary', v_profile.phone_secondary,
    'phoneVerified', v_profile.phone_verified_at is not null,
    'avatarUrl', v_profile.avatar_url,
    'kycLevel', v_profile.kyc_level,
    'trustIndex', v_profile.trust_index,
    'document', case when v_doc.id is null then null else jsonb_build_object(
      'kind', v_doc.doc_kind,
      'number', v_doc.doc_number,
      'issuedOn', v_doc.issued_on,
      'expiresOn', v_doc.expires_on,
      'issuedAt', v_doc.issued_at,
      'issuingCountry', v_doc.issuing_country,
      'status', v_doc.status
    ) end,
    'address', case when v_addr.id is null then null else jsonb_build_object(
      'country', v_addr.country,
      'province', v_addr.province,
      'municipality', v_addr.municipality,
      'commune', v_addr.commune,
      'neighborhood', v_addr.neighborhood,
      'street', v_addr.street,
      'number', v_addr.number,
      'postalCode', v_addr.postal_code,
      'line', concat_ws(', ',
        nullif(trim(concat_ws(' ', v_addr.street, v_addr.number)), ''),
        v_addr.neighborhood,
        v_addr.commune,
        v_addr.municipality,
        v_addr.province,
        v_addr.country
      )
    ) end
  );
end;
$$;

revoke all on function public.get_identity_party_snapshot(uuid) from public;
grant execute on function public.get_identity_party_snapshot(uuid) to authenticated;

-- Own data export
create or replace function public.export_my_identity_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  perform public.write_audit_log(
    'identity.data_exported',
    'profile',
    v_actor::text,
    '{}'::jsonb
  );

  return public.get_identity_party_snapshot(v_actor)
    || jsonb_build_object(
      'banking', (
        select jsonb_build_object(
          'bankName', b.bank_name,
          'iban', b.iban,
          'accountNumber', b.account_number,
          'accountHolderName', b.account_holder_name,
          'digitalWallets', b.digital_wallets,
          'status', b.verification_status
        )
        from public.identity_banking b
        where b.user_id = v_actor and b.deleted_at is null
        limit 1
      )
    );
end;
$$;

revoke all on function public.export_my_identity_data() from public;
grant execute on function public.export_my_identity_data() to authenticated;

-- KYC gate helper
create or replace function public.user_meets_kyc_level(p_user_id uuid, p_min_level int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select kyc_level >= p_min_level from public.profiles where id = p_user_id and deleted_at is null),
    false
  );
$$;

revoke all on function public.user_meets_kyc_level(uuid, int) from public;
grant execute on function public.user_meets_kyc_level(uuid, int) to authenticated;

-- Enforce KYC on non-demo contract creation (level ≥ 2 for client + partner)
create or replace function public.create_property_contract(
  p_property_id uuid,
  p_client_id uuid,
  p_purpose text,
  p_amount_aoa numeric,
  p_title text,
  p_terms_notes text default null,
  p_agent_id uuid default null,
  p_interest_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_property public.properties%rowtype;
  v_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not public.user_has_permission(v_actor, 'contracts.manage') then
    raise exception 'contracts.manage required';
  end if;

  if p_purpose not in ('rent', 'sale') then
    raise exception 'invalid contract purpose';
  end if;

  if p_amount_aoa is null or p_amount_aoa <= 0 then
    raise exception 'amount required';
  end if;

  if p_title is null or length(trim(p_title)) < 3 then
    raise exception 'title required';
  end if;

  select *
  into v_property
  from public.properties
  where id = p_property_id
    and deleted_at is null
    and status = 'active';

  if not found then
    raise exception 'property not available';
  end if;

  if v_property.purpose not in (p_purpose, 'both') then
    raise exception 'property purpose mismatch';
  end if;

  if not public.user_has_permission(v_actor, 'admin.panel')
     and (
       v_property.owner_id is distinct from v_actor
       or not public.user_has_permission(v_actor, 'properties.manage')
     ) then
    raise exception 'partner or admin required';
  end if;

  if p_interest_id is not null and not exists (
    select 1
    from public.property_interests i
    where i.id = p_interest_id
      and i.property_id = p_property_id
      and i.client_id = p_client_id
  ) then
    raise exception 'interest does not match contract parties';
  end if;

  -- Identidade real obrigatória para contratos reais
  if coalesce(v_property.is_demo, false) is false
     and not public.user_has_permission(v_actor, 'admin.panel') then
    if not public.user_meets_kyc_level(p_client_id, 2) then
      raise exception 'client identity verification required (KYC level 2)';
    end if;
    if not public.user_meets_kyc_level(v_property.owner_id, 2) then
      raise exception 'partner identity verification required (KYC level 2)';
    end if;
  end if;

  insert into public.property_contracts (
    property_id,
    client_id,
    partner_id,
    agent_id,
    interest_id,
    purpose,
    status,
    amount_aoa,
    title,
    terms_notes,
    is_demo,
    created_by,
    updated_by
  )
  values (
    p_property_id,
    p_client_id,
    v_property.owner_id,
    p_agent_id,
    p_interest_id,
    p_purpose,
    'pending_acceptance',
    round(p_amount_aoa, 2),
    trim(p_title),
    nullif(trim(coalesce(p_terms_notes, '')), ''),
    coalesce(v_property.is_demo, false),
    v_actor,
    v_actor
  )
  returning id into v_id;

  perform public.write_audit_log(
    'contract.created',
    'property_contract',
    v_id::text,
    jsonb_build_object('property_id', p_property_id, 'client_id', p_client_id)
  );

  return v_id;
end;
$$;

revoke all on function public.create_property_contract(uuid, uuid, text, numeric, text, text, uuid, uuid) from public;
grant execute on function public.create_property_contract(uuid, uuid, text, numeric, text, text, uuid, uuid) to authenticated;

-- trust.manage for service_provider + ensure client/agent lenses can KYC
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'trust.manage'
where r.code in ('client', 'certified_agent', 'service_provider', 'administrator', 'super_administrator')
on conflict do nothing;

-- Seed richer identity for demo accounts (non-breaking for demos)
do $$
declare
  r record;
begin
  for r in
    select u.id, u.email
    from auth.users u
    where u.email like 'demo.%@kuteka.local'
  loop
    update public.profiles
    set legal_full_name = coalesce(legal_full_name, 'Utilizador Demo Kuteka'),
        preferred_name = coalesce(preferred_name, display_name, 'Demo'),
        sex = coalesce(sex, 'undisclosed'),
        birth_date = coalesce(birth_date, date '1990-01-15'),
        nationality = coalesce(nationality, 'Angolana'),
        place_of_birth = coalesce(place_of_birth, 'Luanda'),
        marital_status = coalesce(marital_status, 'single'),
        phone_primary = coalesce(phone_primary, '+244900000000'),
        phone_verified_at = coalesce(phone_verified_at, timezone('utc', now()))
    where id = r.id;

    insert into public.identity_addresses (
      user_id, country, province, municipality, commune, neighborhood, street, number,
      verification_status, created_by, updated_by
    )
    values (
      r.id, 'AO', 'Luanda', 'Luanda', 'Ingombota', 'Maianga', 'Rua Demo Kuteka', '1',
      'verified', r.id, r.id
    )
    on conflict (user_id) do update
    set verification_status = 'verified',
        province = excluded.province,
        municipality = excluded.municipality;

    insert into public.identity_id_documents (
      user_id, doc_kind, doc_number, issued_on, expires_on, issued_at, issuing_country,
      status, created_by, updated_by
    )
    select
      r.id, 'bi', 'DEMO' || substr(replace(r.id::text, '-', ''), 1, 8),
      date '2020-01-01', date '2030-01-01', 'Luanda', 'AO',
      'accepted', r.id, r.id
    where not exists (
      select 1 from public.identity_id_documents d
      where d.user_id = r.id and d.deleted_at is null and d.status = 'accepted'
    );

    perform public.recompute_profile_kyc(r.id);
  end loop;
end $$;
