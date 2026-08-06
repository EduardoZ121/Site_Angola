-- 0033_kuteka_chat_trust.sql
-- Sprint Beta 1.5 — Chat Kuteka MVP
-- Ref: docs/product/SPRINT_BETA_1_5.md
--
-- Scope of this migration: CHAT ONLY (kuteka_conversations / participants /
-- messages + RPCs). Reputation/Trust extensions for Beta 1.5 (e.g. peer
-- reviews tied to a completed contract/service, richer trust scoring) are
-- intentionally deferred to a follow-up migration — the existing Confiança
-- schema (0013_premium_listing_reputation.sql, 0018_identity_kyc.sql,
-- 0029/0030 KIS) already covers KYC + reputation basics and is not touched
-- here to respect the Core v1 freeze and keep this migration reviewable.
--
-- Business rules (PO):
--   - Allowed pairs: Client↔Partner, Client↔Agent, Partner↔Agent,
--     Partner↔Admin, Provider↔Client (only with a contracted service),
--     Provider↔Partner, Admin↔anyone, SuperAdmin↔anyone.
--   - Phone/email are NEVER shown by default. Communication stays inside
--     Kuteka Chat until a contract exists, a visit is scheduled, or an
--     explicit share authorization is granted (contact_request /
--     contact_share message kinds — gated below).
--   - Conversations are created ONLY via kuteka_chat_start_direct (security
--     definer). Direct INSERTs into kuteka_conversations are blocked.
--
-- Aditivo (Core v1 freeze respeitado): apenas novas tabelas/RPCs.

-- ═══════════════════════════════════════════════════════════════════════════
-- 0. Tables
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.kuteka_conversations (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'active'
    check (status in ('active', 'archived', 'completed')),
  context_type text not null default 'general'
    check (context_type in ('property', 'contract', 'service', 'general', 'admin', 'interest')),
  context_id uuid,
  property_id uuid references public.properties (id) on delete set null,
  contract_id uuid references public.property_contracts (id) on delete set null,
  title text,
  last_message_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists kuteka_conversations_status_idx
  on public.kuteka_conversations (status)
  where deleted_at is null;
create index if not exists kuteka_conversations_property_idx
  on public.kuteka_conversations (property_id)
  where deleted_at is null;
create index if not exists kuteka_conversations_contract_idx
  on public.kuteka_conversations (contract_id)
  where deleted_at is null;
create index if not exists kuteka_conversations_last_message_idx
  on public.kuteka_conversations (last_message_at desc)
  where deleted_at is null;

drop trigger if exists kuteka_conversations_set_updated_at on public.kuteka_conversations;
create trigger kuteka_conversations_set_updated_at
before update on public.kuteka_conversations
for each row execute function public.set_updated_at();

comment on table public.kuteka_conversations is
  'Kuteka Chat MVP (Sprint Beta 1.5). Rows are created exclusively via '
  'kuteka_chat_start_direct — direct client INSERTs are blocked.';

create table if not exists public.kuteka_conversation_participants (
  conversation_id uuid not null references public.kuteka_conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  participant_role text not null default 'other'
    check (participant_role in (
      'client', 'partner', 'agent', 'provider', 'admin', 'superadmin', 'other'
    )),
  last_read_at timestamptz,
  archived_for_user boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (conversation_id, user_id)
);

create index if not exists kuteka_conversation_participants_user_idx
  on public.kuteka_conversation_participants (user_id);

comment on column public.kuteka_conversation_participants.archived_for_user is
  'Per-user "hide from my inbox" flag — independent from the shared '
  'conversation.status (active/archived/completed). Not yet wired to an RPC '
  'in the MVP; reserved for a future "archive for me" action.';

create table if not exists public.kuteka_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.kuteka_conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 4000),
  kind text not null default 'text'
    check (kind in ('text', 'system', 'contact_request', 'contact_share')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create index if not exists kuteka_messages_conversation_idx
  on public.kuteka_messages (conversation_id, created_at)
  where deleted_at is null;
create index if not exists kuteka_messages_sender_idx
  on public.kuteka_messages (sender_id);

comment on table public.kuteka_messages is
  'Kuteka Chat messages. kind=contact_request/contact_share is only accepted '
  '(RPC + RLS) when the conversation has an active/completed contract — see '
  'public.kuteka_chat_contract_active().';

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Role + pairing helpers (defined before RLS — the messages INSERT policy
--    below calls kuteka_chat_contract_active()).
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_chat_roles_of(p_user_id uuid)
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(distinct mapped.role), '{}'::text[])
  from (
    select case r
      when 'client' then 'client'
      when 'patrimonial_partner' then 'partner'
      when 'certified_agent' then 'agent'
      when 'administrator' then 'admin'
      when 'super_administrator' then 'superadmin'
      else null
    end as role
    from unnest(public.get_user_role_codes(p_user_id)) as r
    union all
    select 'provider'
    where exists (
      select 1 from public.service_providers sp
      where sp.user_id = p_user_id and sp.deleted_at is null and sp.active
    )
  ) mapped
  where mapped.role is not null;
$$;

revoke all on function public.kuteka_chat_roles_of(uuid) from public;
grant execute on function public.kuteka_chat_roles_of(uuid) to authenticated, service_role;

create or replace function public.kuteka_chat_primary_role(p_user_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_roles text[] := public.kuteka_chat_roles_of(p_user_id);
begin
  if 'superadmin' = any(v_roles) then return 'superadmin'; end if;
  if 'admin' = any(v_roles) then return 'admin'; end if;
  if 'agent' = any(v_roles) then return 'agent'; end if;
  if 'partner' = any(v_roles) then return 'partner'; end if;
  if 'provider' = any(v_roles) then return 'provider'; end if;
  if 'client' = any(v_roles) then return 'client'; end if;
  return 'other';
end;
$$;

revoke all on function public.kuteka_chat_primary_role(uuid) from public;
grant execute on function public.kuteka_chat_primary_role(uuid) to authenticated, service_role;

-- Provider↔Client is only allowed once there is (or was) a contracted
-- service between the two accounts. Used both by kuteka_chat_can_pair and by
-- the contact_request/contact_share gate (which also accepts a formalised
-- property_contracts row).
create or replace function public.kuteka_chat_has_service_contract(p_user_a uuid, p_user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.service_orders o
    join public.service_providers sp on sp.id = o.provider_id
    where o.deleted_at is null
      and o.status in ('accepted', 'in_progress', 'completed')
      and (
        (sp.user_id = p_user_a and o.client_id = p_user_b)
        or (sp.user_id = p_user_b and o.client_id = p_user_a)
      )
  );
$$;

revoke all on function public.kuteka_chat_has_service_contract(uuid, uuid) from public;
grant execute on function public.kuteka_chat_has_service_contract(uuid, uuid) to authenticated, service_role;

create or replace function public.kuteka_chat_can_pair(p_actor uuid, p_peer uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor_roles text[];
  v_peer_roles text[];
begin
  if p_actor is null or p_peer is null or p_actor = p_peer then
    return false;
  end if;

  v_actor_roles := public.kuteka_chat_roles_of(p_actor);
  v_peer_roles := public.kuteka_chat_roles_of(p_peer);

  -- Admin↔anyone, SuperAdmin↔anyone
  if 'admin' = any(v_actor_roles) or 'superadmin' = any(v_actor_roles)
     or 'admin' = any(v_peer_roles) or 'superadmin' = any(v_peer_roles) then
    return true;
  end if;

  -- Client↔Partner
  if ('client' = any(v_actor_roles) and 'partner' = any(v_peer_roles))
     or ('partner' = any(v_actor_roles) and 'client' = any(v_peer_roles)) then
    return true;
  end if;

  -- Client↔Agent
  if ('client' = any(v_actor_roles) and 'agent' = any(v_peer_roles))
     or ('agent' = any(v_actor_roles) and 'client' = any(v_peer_roles)) then
    return true;
  end if;

  -- Partner↔Agent
  if ('partner' = any(v_actor_roles) and 'agent' = any(v_peer_roles))
     or ('agent' = any(v_actor_roles) and 'partner' = any(v_peer_roles)) then
    return true;
  end if;

  -- Provider↔Partner
  if ('provider' = any(v_actor_roles) and 'partner' = any(v_peer_roles))
     or ('partner' = any(v_actor_roles) and 'provider' = any(v_peer_roles)) then
    return true;
  end if;

  -- Provider↔Client — only with a contracted service
  if ('provider' = any(v_actor_roles) and 'client' = any(v_peer_roles))
     or ('client' = any(v_actor_roles) and 'provider' = any(v_peer_roles)) then
    return public.kuteka_chat_has_service_contract(p_actor, p_peer);
  end if;

  return false;
end;
$$;

revoke all on function public.kuteka_chat_can_pair(uuid, uuid) from public;
grant execute on function public.kuteka_chat_can_pair(uuid, uuid) to authenticated, service_role;

-- Contacts are only released once the conversation is tied to an
-- active/completed contract. Extending this to "scheduled visit" or an
-- explicit admin authorization (metadata.authorized=true) is planned but
-- deferred — see comment at the top of this file.
create or replace function public.kuteka_chat_contract_active(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.kuteka_conversations c
    join public.property_contracts pc on pc.id = c.contract_id
    where c.id = p_conversation_id
      and c.contract_id is not null
      and pc.deleted_at is null
      and pc.status in ('active', 'completed')
  );
$$;

revoke all on function public.kuteka_chat_contract_active(uuid) from public;
grant execute on function public.kuteka_chat_contract_active(uuid) to authenticated, service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. RLS
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.kuteka_conversations enable row level security;
alter table public.kuteka_conversation_participants enable row level security;
alter table public.kuteka_messages enable row level security;

drop policy if exists kuteka_conversations_select_participant on public.kuteka_conversations;
create policy kuteka_conversations_select_participant
  on public.kuteka_conversations for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.kuteka_conversation_participants p
      where p.conversation_id = kuteka_conversations.id
        and p.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policy for authenticated: conversations are only
-- created/updated via SECURITY DEFINER RPCs below (kuteka_chat_start_direct,
-- kuteka_chat_send_message, kuteka_chat_set_status), which run with the
-- function owner's privileges and bypass RLS.
revoke insert, update, delete on public.kuteka_conversations from anon, authenticated;
grant select on public.kuteka_conversations to authenticated;
grant all on public.kuteka_conversations to service_role;

drop policy if exists kuteka_participants_select_shared on public.kuteka_conversation_participants;
create policy kuteka_participants_select_shared
  on public.kuteka_conversation_participants for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.kuteka_conversation_participants me
      where me.conversation_id = kuteka_conversation_participants.conversation_id
        and me.user_id = auth.uid()
    )
  );

revoke insert, update, delete on public.kuteka_conversation_participants from anon, authenticated;
grant select on public.kuteka_conversation_participants to authenticated;
grant all on public.kuteka_conversation_participants to service_role;

drop policy if exists kuteka_messages_select_participant on public.kuteka_messages;
create policy kuteka_messages_select_participant
  on public.kuteka_messages for select to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.kuteka_conversation_participants p
      where p.conversation_id = kuteka_messages.conversation_id
        and p.user_id = auth.uid()
    )
  );

-- Defense-in-depth: allow direct inserts only if participant, sender = self,
-- body within limits, and contact_request/contact_share only when the
-- conversation is tied to an active/completed contract. The app always goes
-- through kuteka_chat_send_message (SECURITY DEFINER), which enforces the
-- same rules with a friendlier error message.
drop policy if exists kuteka_messages_insert_participant on public.kuteka_messages;
create policy kuteka_messages_insert_participant
  on public.kuteka_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.kuteka_conversation_participants p
      where p.conversation_id = kuteka_messages.conversation_id
        and p.user_id = auth.uid()
    )
    and length(trim(body)) > 0
    and length(body) <= 4000
    and (
      kind not in ('contact_request', 'contact_share')
      or public.kuteka_chat_contract_active(conversation_id)
    )
  );

revoke update, delete on public.kuteka_messages from anon, authenticated;
grant select, insert on public.kuteka_messages to authenticated;
grant all on public.kuteka_messages to service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. RPCs
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.kuteka_chat_start_direct(
  p_peer_user_id uuid,
  p_context_type text default 'general',
  p_context_id uuid default null,
  p_property_id uuid default null,
  p_contract_id uuid default null,
  p_title text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_conversation_id uuid;
  v_title text := nullif(trim(coalesce(p_title, '')), '');
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if p_peer_user_id is null then
    raise exception 'kuteka_chat: peer user is required';
  end if;
  if p_peer_user_id = v_actor then
    raise exception 'kuteka_chat: cannot start a conversation with yourself';
  end if;
  if coalesce(p_context_type, 'general') not in
     ('property', 'contract', 'service', 'general', 'admin', 'interest') then
    raise exception 'kuteka_chat: invalid context type';
  end if;
  if not exists (select 1 from auth.users u where u.id = p_peer_user_id) then
    raise exception 'kuteka_chat: peer user not found';
  end if;

  if not public.kuteka_chat_can_pair(v_actor, p_peer_user_id) then
    raise exception
      'kuteka_chat: messaging is not allowed between these account roles yet (contract or role pairing required)';
  end if;

  -- Reuse an existing 1:1 conversation with the same context to avoid
  -- fragmenting the thread every time the CTA is pressed again.
  select c.id
  into v_conversation_id
  from public.kuteka_conversations c
  where c.deleted_at is null
    and c.context_type = coalesce(p_context_type, 'general')
    and c.property_id is not distinct from p_property_id
    and c.contract_id is not distinct from p_contract_id
    and c.context_id is not distinct from p_context_id
    and exists (
      select 1 from public.kuteka_conversation_participants pa
      where pa.conversation_id = c.id and pa.user_id = v_actor
    )
    and exists (
      select 1 from public.kuteka_conversation_participants pb
      where pb.conversation_id = c.id and pb.user_id = p_peer_user_id
    )
    and (
      select count(*) from public.kuteka_conversation_participants pp
      where pp.conversation_id = c.id
    ) = 2
  order by c.created_at desc
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  insert into public.kuteka_conversations (
    status, context_type, context_id, property_id, contract_id, title,
    created_by, last_message_at
  ) values (
    'active', coalesce(p_context_type, 'general'), p_context_id, p_property_id, p_contract_id,
    v_title, v_actor, timezone('utc', now())
  )
  returning id into v_conversation_id;

  insert into public.kuteka_conversation_participants (
    conversation_id, user_id, participant_role, last_read_at
  ) values
    (v_conversation_id, v_actor, public.kuteka_chat_primary_role(v_actor), timezone('utc', now())),
    (v_conversation_id, p_peer_user_id, public.kuteka_chat_primary_role(p_peer_user_id), null);

  perform public.write_audit_log(
    'chat.conversation_started',
    'kuteka_conversation',
    v_conversation_id::text,
    jsonb_build_object('peer_id', p_peer_user_id, 'context_type', p_context_type)
  );

  return v_conversation_id;
end;
$$;

revoke all on function public.kuteka_chat_start_direct(uuid, text, uuid, uuid, uuid, text) from public;
grant execute on function public.kuteka_chat_start_direct(uuid, text, uuid, uuid, uuid, text) to authenticated;

create or replace function public.kuteka_chat_send_message(
  p_conversation_id uuid,
  p_body text,
  p_kind text default 'text'
)
returns public.kuteka_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_conv public.kuteka_conversations%rowtype;
  v_body text;
  v_row public.kuteka_messages%rowtype;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;
  if coalesce(p_kind, 'text') not in ('text', 'system', 'contact_request', 'contact_share') then
    raise exception 'kuteka_chat: invalid message kind';
  end if;

  select * into v_conv
  from public.kuteka_conversations
  where id = p_conversation_id and deleted_at is null;
  if not found then
    raise exception 'kuteka_chat: conversation not found';
  end if;

  if not exists (
    select 1 from public.kuteka_conversation_participants
    where conversation_id = p_conversation_id and user_id = v_actor
  ) then
    raise exception 'kuteka_chat: you are not a participant of this conversation';
  end if;

  v_body := trim(coalesce(p_body, ''));
  if length(v_body) = 0 then
    raise exception 'kuteka_chat: message cannot be empty';
  end if;
  if length(v_body) > 4000 then
    raise exception 'kuteka_chat: message is too long (max 4000 characters)';
  end if;

  if p_kind in ('contact_request', 'contact_share')
     and not public.kuteka_chat_contract_active(p_conversation_id) then
    raise exception
      'kuteka_chat: contacts are only released after an active/completed contract, a scheduled visit, or an explicit authorization';
  end if;

  insert into public.kuteka_messages (conversation_id, sender_id, body, kind, metadata)
  values (p_conversation_id, v_actor, v_body, coalesce(p_kind, 'text'), '{}'::jsonb)
  returning * into v_row;

  update public.kuteka_conversations
  set last_message_at = v_row.created_at,
      updated_at = timezone('utc', now()),
      status = case when status = 'archived' then 'active' else status end
  where id = p_conversation_id;

  update public.kuteka_conversation_participants
  set last_read_at = v_row.created_at
  where conversation_id = p_conversation_id and user_id = v_actor;

  return v_row;
end;
$$;

revoke all on function public.kuteka_chat_send_message(uuid, text, text) from public;
grant execute on function public.kuteka_chat_send_message(uuid, text, text) to authenticated;

create or replace function public.kuteka_chat_mark_read(p_conversation_id uuid)
returns void
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

  update public.kuteka_conversation_participants
  set last_read_at = timezone('utc', now())
  where conversation_id = p_conversation_id and user_id = v_actor;

  if not found then
    raise exception 'kuteka_chat: you are not a participant of this conversation';
  end if;
end;
$$;

revoke all on function public.kuteka_chat_mark_read(uuid) from public;
grant execute on function public.kuteka_chat_mark_read(uuid) to authenticated;

create or replace function public.kuteka_chat_set_status(p_conversation_id uuid, p_status text)
returns void
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
  if p_status not in ('active', 'archived', 'completed') then
    raise exception 'kuteka_chat: invalid status';
  end if;

  if not exists (
    select 1 from public.kuteka_conversation_participants
    where conversation_id = p_conversation_id and user_id = v_actor
  ) and not public.user_has_permission(v_actor, 'admin.panel') then
    raise exception 'kuteka_chat: only participants or admins can change this conversation status';
  end if;

  update public.kuteka_conversations
  set status = p_status, updated_at = timezone('utc', now())
  where id = p_conversation_id and deleted_at is null;

  if not found then
    raise exception 'kuteka_chat: conversation not found';
  end if;
end;
$$;

revoke all on function public.kuteka_chat_set_status(uuid, text) from public;
grant execute on function public.kuteka_chat_set_status(uuid, text) to authenticated;

create or replace function public.kuteka_chat_unread_total()
returns int
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_total int;
begin
  if v_actor is null then
    return 0;
  end if;

  select coalesce(count(*), 0)
  into v_total
  from public.kuteka_messages m
  join public.kuteka_conversation_participants p
    on p.conversation_id = m.conversation_id and p.user_id = v_actor
  where m.deleted_at is null
    and m.sender_id <> v_actor
    and m.created_at > coalesce(p.last_read_at, 'epoch'::timestamptz);

  return v_total;
end;
$$;

revoke all on function public.kuteka_chat_unread_total() from public;
grant execute on function public.kuteka_chat_unread_total() to authenticated;

create or replace function public.kuteka_chat_list_conversations(p_query text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_query text := nullif(trim(coalesce(p_query, '')), '');
  v_result jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  with my_conversations as (
    select c.*
    from public.kuteka_conversations c
    join public.kuteka_conversation_participants me
      on me.conversation_id = c.id and me.user_id = v_actor
    where c.deleted_at is null
  ),
  peers as (
    select
      mc.id as conversation_id,
      p.user_id as peer_user_id,
      coalesce(prof.display_name, 'Utilizador Kuteka') as peer_name,
      p.participant_role as peer_role
    from my_conversations mc
    join public.kuteka_conversation_participants p
      on p.conversation_id = mc.id and p.user_id <> v_actor
    left join public.profiles prof on prof.id = p.user_id
  ),
  peer_agg as (
    select
      conversation_id,
      string_agg(distinct peer_name, ', ' order by peer_name) as peer_name,
      (array_agg(peer_user_id))[1] as peer_user_id,
      (array_agg(peer_role))[1] as peer_role
    from peers
    group by conversation_id
  ),
  last_msg as (
    select distinct on (m.conversation_id)
      m.conversation_id,
      m.body as preview,
      m.kind as preview_kind,
      m.created_at as preview_at
    from public.kuteka_messages m
    where m.deleted_at is null
    order by m.conversation_id, m.created_at desc
  ),
  unread as (
    select
      m.conversation_id,
      count(*)::int as unread_count
    from public.kuteka_messages m
    join public.kuteka_conversation_participants me
      on me.conversation_id = m.conversation_id and me.user_id = v_actor
    where m.deleted_at is null
      and m.sender_id <> v_actor
      and m.created_at > coalesce(me.last_read_at, 'epoch'::timestamptz)
    group by m.conversation_id
  ),
  agg_rows as (
    select jsonb_build_object(
      'id', mc.id,
      'status', mc.status,
      'context_type', mc.context_type,
      'context_id', mc.context_id,
      'property_id', mc.property_id,
      'contract_id', mc.contract_id,
      'title', mc.title,
      'peer_user_id', pa.peer_user_id,
      'peer_name', coalesce(pa.peer_name, mc.title, 'Conversa Kuteka'),
      'peer_role', pa.peer_role,
      'last_preview', left(coalesce(lm.preview, ''), 140),
      'last_preview_kind', lm.preview_kind,
      'last_message_at', coalesce(lm.preview_at, mc.last_message_at, mc.created_at),
      'unread_count', coalesce(u.unread_count, 0),
      'created_at', mc.created_at
    ) as row_data,
    coalesce(lm.preview_at, mc.last_message_at, mc.created_at) as sort_at
    from my_conversations mc
    left join peer_agg pa on pa.conversation_id = mc.id
    left join last_msg lm on lm.conversation_id = mc.id
    left join unread u on u.conversation_id = mc.id
    where (
      v_query is null
      or mc.title ilike '%' || v_query || '%'
      or pa.peer_name ilike '%' || v_query || '%'
      or lm.preview ilike '%' || v_query || '%'
    )
  )
  select coalesce(jsonb_agg(row_data order by sort_at desc), '[]'::jsonb)
  into v_result
  from agg_rows;

  return v_result;
end;
$$;

revoke all on function public.kuteka_chat_list_conversations(text) from public;
grant execute on function public.kuteka_chat_list_conversations(text) to authenticated;

-- Thread payload deliberately excludes auth.users email/phone — only
-- profiles.display_name is surfaced. Contact info is only shared inside a
-- contact_share message body, and only once kuteka_chat_contract_active().
create or replace function public.kuteka_chat_get_thread(p_conversation_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_result jsonb;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1 from public.kuteka_conversation_participants
    where conversation_id = p_conversation_id and user_id = v_actor
  ) then
    raise exception 'kuteka_chat: you are not a participant of this conversation';
  end if;

  select jsonb_build_object(
    'conversation', (
      select jsonb_build_object(
        'id', c.id,
        'status', c.status,
        'context_type', c.context_type,
        'context_id', c.context_id,
        'property_id', c.property_id,
        'contract_id', c.contract_id,
        'title', c.title,
        'created_at', c.created_at,
        'last_message_at', c.last_message_at,
        'contacts_released', public.kuteka_chat_contract_active(c.id)
      )
      from public.kuteka_conversations c
      where c.id = p_conversation_id
    ),
    'participants', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'user_id', p.user_id,
        'role', p.participant_role,
        'display_name', coalesce(pr.display_name, 'Utilizador Kuteka'),
        'is_self', p.user_id = v_actor,
        'last_read_at', p.last_read_at
      )), '[]'::jsonb)
      from public.kuteka_conversation_participants p
      left join public.profiles pr on pr.id = p.user_id
      where p.conversation_id = p_conversation_id
    ),
    'messages', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', m.id,
        'sender_id', m.sender_id,
        'body', m.body,
        'kind', m.kind,
        'metadata', m.metadata,
        'created_at', m.created_at,
        'is_self', m.sender_id = v_actor
      ) order by m.created_at asc), '[]'::jsonb)
      from public.kuteka_messages m
      where m.conversation_id = p_conversation_id and m.deleted_at is null
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.kuteka_chat_get_thread(uuid) from public;
grant execute on function public.kuteka_chat_get_thread(uuid) to authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Feature flag — kuteka_chat (KOCC)
-- ═══════════════════════════════════════════════════════════════════════════

insert into public.platform_feature_flags (
  code, label, description, enabled, operational_status, allowed_countries
) values (
  'kuteka_chat',
  'Chat Kuteka',
  'Mensagens directas dentro da plataforma entre Cliente, Parceiro, Agente, Prestador e Administração — sem expor telefone/email por defeito.',
  true,
  'beta_public',
  '{AO}'
)
on conflict (code) do update
set label = excluded.label,
    description = excluded.description,
    operational_status = coalesce(public.platform_feature_flags.operational_status, excluded.operational_status);
