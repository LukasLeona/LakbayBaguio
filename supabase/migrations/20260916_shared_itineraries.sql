begin;

create table if not exists public.shared_itineraries (
  id uuid primary key default gen_random_uuid(),
  share_token text not null unique check (share_token ~ '^[a-f0-9]{32}$'),
  owner_id uuid not null references public.profiles(user_id) on delete cascade,
  itinerary jsonb not null check (jsonb_typeof(itinerary) = 'object'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

create index if not exists shared_itineraries_owner_created_idx
  on public.shared_itineraries (owner_id, created_at desc);
create index if not exists shared_itineraries_expiry_idx
  on public.shared_itineraries (expires_at);

alter table public.shared_itineraries enable row level security;

create or replace function public.create_shared_itinerary(p_itinerary jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  if not exists (select 1 from public.profiles where user_id = auth.uid()) then
    raise exception 'Anonymous profile is not ready';
  end if;

  if p_itinerary is null or jsonb_typeof(p_itinerary) <> 'object' then
    raise exception 'Invalid itinerary';
  end if;

  if jsonb_typeof(p_itinerary -> 'days') <> 'array'
    or jsonb_array_length(p_itinerary -> 'days') not between 1 and 5
    or char_length(coalesce(p_itinerary ->> 'title', '')) not between 3 and 120
    or char_length(coalesce(p_itinerary ->> 'id', '')) not between 3 and 100
    or pg_column_size(p_itinerary) > 262144 then
    raise exception 'Invalid itinerary payload';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 7120));

  select shared.share_token into v_token
  from public.shared_itineraries shared
  where shared.owner_id = auth.uid()
    and shared.itinerary ->> 'id' = p_itinerary ->> 'id'
    and shared.expires_at > now()
  order by shared.created_at desc
  limit 1;

  if v_token is not null then
    return v_token;
  end if;

  if (
    select count(*)
    from public.shared_itineraries shared
    where shared.owner_id = auth.uid()
      and shared.created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Share limit reached. Please try again later';
  end if;

  v_token := replace(gen_random_uuid()::text, '-', '');
  insert into public.shared_itineraries (share_token, owner_id, itinerary)
  values (v_token, auth.uid(), p_itinerary);
  return v_token;
end;
$$;

create or replace function public.get_shared_itinerary(p_share_token text)
returns table (itinerary jsonb, created_at timestamptz, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select shared.itinerary, shared.created_at, shared.expires_at
  from public.shared_itineraries shared
  where shared.share_token = lower(btrim(p_share_token))
    and shared.expires_at > now()
  limit 1;
$$;

create or replace function public.cleanup_expired_shared_itineraries()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.shared_itineraries where expires_at <= now();
$$;

revoke all on public.shared_itineraries from public, anon, authenticated;
revoke all on function public.create_shared_itinerary(jsonb) from public, anon, authenticated;
revoke all on function public.get_shared_itinerary(text) from public, anon, authenticated;
revoke all on function public.cleanup_expired_shared_itineraries() from public, anon, authenticated;

grant all on public.shared_itineraries to service_role;
grant execute on function public.create_shared_itinerary(jsonb) to authenticated, service_role;
grant execute on function public.get_shared_itinerary(text) to anon, authenticated, service_role;
grant execute on function public.cleanup_expired_shared_itineraries() to service_role;

select cron.schedule(
  'cleanup-expired-shared-itineraries',
  '17 3 * * *',
  $job$select public.cleanup_expired_shared_itineraries();$job$
)
where not exists (select 1 from cron.job where jobname = 'cleanup-expired-shared-itineraries');

commit;
