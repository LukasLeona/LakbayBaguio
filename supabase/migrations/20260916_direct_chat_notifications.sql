begin;

create or replace function public.start_direct_conversation(p_target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation_id uuid;
begin
  if auth.uid() is null or p_target_user_id = auth.uid() then
    raise exception 'Invalid chat target';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 7103));
  perform pg_advisory_xact_lock(hashtextextended(
    least(auth.uid()::text, p_target_user_id::text) || ':' || greatest(auth.uid()::text, p_target_user_id::text),
    7104
  ));

  if exists (
    select 1 from public.blocks
    where (blocker_id = auth.uid() and blocked_id = p_target_user_id)
       or (blocker_id = p_target_user_id and blocked_id = auth.uid())
  ) then
    raise exception 'Chat is unavailable';
  end if;

  select mine.conversation_id into v_conversation_id
  from public.conversation_members mine
  join public.conversation_members theirs using (conversation_id)
  where mine.user_id = auth.uid()
    and theirs.user_id = p_target_user_id
    and mine.left_at is null
    and theirs.left_at is null
  limit 1;

  if v_conversation_id is not null then return v_conversation_id; end if;

  if not exists (
    select 1
    from public.presence mine
    join public.presence target on target.user_id = p_target_user_id
    where mine.user_id = auth.uid()
      and mine.is_discoverable
      and target.is_discoverable
      and mine.expires_at > now()
      and target.expires_at > now()
      and extensions.st_dwithin(mine.location, target.location, 5000)
  ) then
    raise exception 'That traveler is no longer available';
  end if;

  if (
    select count(*)
    from public.chat_requests
    where sender_id = auth.uid() and created_at > now() - interval '1 hour'
  ) >= 12 then
    raise exception 'Too many new chats. Please try again later';
  end if;

  insert into public.conversations default values returning id into v_conversation_id;
  insert into public.conversation_members (conversation_id, user_id)
  values (v_conversation_id, auth.uid()), (v_conversation_id, p_target_user_id);
  insert into public.chat_requests (sender_id, receiver_id, status, responded_at, expires_at)
  values (auth.uid(), p_target_user_id, 'accepted', now(), now() + interval '24 hours');

  return v_conversation_id;
end;
$$;

create or replace function public.unread_message_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)
  from public.conversation_members mine
  join public.messages unread on unread.conversation_id = mine.conversation_id
  where mine.user_id = auth.uid()
    and mine.left_at is null
    and unread.sender_id <> auth.uid()
    and unread.created_at > mine.last_read_at
    and public.can_access_conversation(mine.conversation_id);
$$;

revoke all on function public.start_direct_conversation(uuid) from public, anon, authenticated;
revoke all on function public.unread_message_count() from public, anon, authenticated;
grant execute on function public.start_direct_conversation(uuid) to authenticated;
grant execute on function public.unread_message_count() to authenticated;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'cleanup-inactive-lakbay-chats',
  '*/5 * * * *',
  $job$select public.cleanup_inactive_conversations();$job$
)
where not exists (select 1 from cron.job where jobname = 'cleanup-inactive-lakbay-chats');

select cron.schedule(
  'cleanup-stale-baguio-presence',
  '*/5 * * * *',
  $job$select public.cleanup_stale_presence();$job$
)
where not exists (select 1 from cron.job where jobname = 'cleanup-stale-baguio-presence');

commit;
