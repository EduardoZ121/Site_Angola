-- PRD-006: Confiança — trust.manage + trust_documents + admin review

insert into public.permissions (code, description)
values ('trust.manage', 'Gerir checklist e submissões de verificação da conta')
on conflict (code) do update
set description = excluded.description,
    updated_at = timezone('utc', now());

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.code = 'trust.manage'
where r.code in ('client', 'patrimonial_partner', 'certified_agent', 'administrator')
on conflict do nothing;

create table if not exists public.trust_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  doc_type text not null
    check (doc_type in (
      'identity',
      'proof_of_address',
      'property_title',
      'agent_credential'
    )),
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'accepted', 'rejected')),
  notes text,
  rejection_reason text,
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  deleted_at timestamptz
);

create index if not exists trust_documents_user_id_idx
  on public.trust_documents (user_id);
create index if not exists trust_documents_status_idx
  on public.trust_documents (status)
  where deleted_at is null;

drop trigger if exists trust_documents_set_updated_at on public.trust_documents;
create trigger trust_documents_set_updated_at
before update on public.trust_documents
for each row execute function public.set_updated_at();

alter table public.trust_documents enable row level security;

drop policy if exists trust_documents_select_own on public.trust_documents;
create policy trust_documents_select_own
  on public.trust_documents for select to authenticated
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.user_has_permission(auth.uid(), 'admin.panel')
    )
  );

drop policy if exists trust_documents_insert_own on public.trust_documents;
create policy trust_documents_insert_own
  on public.trust_documents for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.user_has_permission(auth.uid(), 'trust.manage')
  );

drop policy if exists trust_documents_update_admin on public.trust_documents;
create policy trust_documents_update_admin
  on public.trust_documents for update to authenticated
  using (
    deleted_at is null
    and public.user_has_permission(auth.uid(), 'admin.panel')
  )
  with check (
    public.user_has_permission(auth.uid(), 'admin.panel')
  );

comment on table public.trust_documents is
  'PRD-006: Itens de verificação da conta (checklist Confiança), sem Passaporte/Score.';

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
    and deleted_at is null;

  if not found then
    raise exception 'document not found';
  end if;

  perform public.write_audit_log(
    'trust.document_reviewed',
    'trust_document',
    p_document_id::text,
    jsonb_build_object('status', p_status)
  );
end;
$$;

revoke all on function public.review_trust_document(uuid, text, text) from public;
grant execute on function public.review_trust_document(uuid, text, text) to authenticated;
