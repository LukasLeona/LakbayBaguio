begin;

create or replace function public.end_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.can_access_conversation(p_conversation_id) then
    raise exception 'Conversation is unavailable';
  end if;

  delete from public.conversations where id = p_conversation_id;
end;
$$;

create or replace function public.cleanup_inactive_conversations()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  delete from public.conversations c
  where coalesce(
    (select max(m.created_at) from public.messages m where m.conversation_id = c.id),
    c.created_at
  ) <= now() - interval '30 minutes';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.end_conversation(uuid) from public, anon, authenticated;
revoke all on function public.cleanup_inactive_conversations() from public, anon, authenticated;
grant execute on function public.end_conversation(uuid) to authenticated;
grant execute on function public.cleanup_inactive_conversations() to service_role;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'cleanup-inactive-lakbay-chats',
  '*/5 * * * *',
  $job$select public.cleanup_inactive_conversations();$job$
)
where not exists (select 1 from cron.job where jobname = 'cleanup-inactive-lakbay-chats');

commit;
