-- 0047_availability_notify_on_publish.sql
-- Doc3 matching notify: when a property becomes publicado/active, notify users with
-- open availability_notify_requests (reuses notify_user).
--
-- Trigger path (security definer) — no client-facing RPC required.
-- Expected behaviour (SQL-doc test contract):
--   1. UPDATE properties SET status='active' OR lifecycle_status='publicado'
--      from a non-matching prior state → notify each open request once.
--   2. Mark matching requests status='notified'.
--   3. Idempotent: second update while already active/publicado does not re-notify.
--   4. Does not fire Pay/custody, Growth Engine, or AGT scraping.

create or replace function public.notify_availability_request_clients(
  p_property_id uuid,
  p_property_title text default null
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req record;
  v_count int := 0;
  v_title text := coalesce(nullif(trim(p_property_title), ''), 'Património');
  v_href text;
begin
  v_href := '/app/habitacao/detalhe?id=' || p_property_id::text;

  for v_req in
    select id, client_id
    from public.availability_notify_requests
    where property_id = p_property_id
      and status = 'open'
  loop
    perform public.notify_user(
      v_req.client_id,
      'availability.available',
      'Imóvel disponível',
      v_title || ' está agora disponível na Kuteka.',
      v_href,
      jsonb_build_object(
        'property_id', p_property_id,
        'request_id', v_req.id
      )
    );

    update public.availability_notify_requests
    set status = 'notified',
        updated_at = timezone('utc', now())
    where id = v_req.id;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.notify_availability_request_clients(uuid, text) from public;
grant execute on function public.notify_availability_request_clients(uuid, text) to service_role;

create or replace function public.trg_properties_notify_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_became_active boolean;
  v_became_publicado boolean;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if new.deleted_at is not null then
    return new;
  end if;

  v_became_active :=
    new.status = 'active'
    and coalesce(old.status, '') is distinct from 'active';

  v_became_publicado :=
    coalesce(new.lifecycle_status, '') = 'publicado'
    and coalesce(old.lifecycle_status, '') is distinct from 'publicado';

  if v_became_active or v_became_publicado then
    perform public.notify_availability_request_clients(new.id, new.title);
  end if;

  return new;
end;
$$;

drop trigger if exists properties_notify_availability on public.properties;
create trigger properties_notify_availability
after update of status, lifecycle_status, deleted_at on public.properties
for each row
execute function public.trg_properties_notify_availability();

comment on function public.notify_availability_request_clients(uuid, text) is
  'Notify clients with open availability_notify_requests when property becomes available.';
comment on function public.trg_properties_notify_availability() is
  'AFTER UPDATE on properties: publish/active → notify_availability_request_clients.';
