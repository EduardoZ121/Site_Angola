-- Estados do sino: lida (read_at), arquivada (archived_at), acção (metadata.action).
-- Não apaga notificações. O contador da interface só conta não lidas.

alter table public.user_notifications
  add column if not exists archived_at timestamptz;

create or replace function public.archive_my_notifications(p_ids uuid[])
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_ids is null or cardinality(p_ids) = 0 then
    return 0;
  end if;
  update public.user_notifications
  set archived_at = timezone('utc', now()),
      read_at = coalesce(read_at, timezone('utc', now()))
  where user_id = auth.uid()
    and archived_at is null
    and id = any (p_ids);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.archive_my_notifications(uuid[]) from public;
grant execute on function public.archive_my_notifications(uuid[]) to authenticated;
