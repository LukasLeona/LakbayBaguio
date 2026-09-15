-- Temporarily allow off-site testing of Nearby while preserving the option to
-- restore the Baguio-only server boundary before public launch.

begin;

create table if not exists public.community_settings (
  key text primary key,
  enforce_baguio_geofence boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint community_settings_known_key check (key in ('nearby'))
);

alter table public.community_settings enable row level security;

insert into public.community_settings (key, enforce_baguio_geofence, updated_at)
values ('nearby', false, now())
on conflict (key) do update set
  enforce_baguio_geofence = excluded.enforce_baguio_geofence,
  updated_at = excluded.updated_at;

create or replace function public.upsert_presence(
  p_latitude double precision,
  p_longitude double precision,
  p_discoverable boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_location public.presence.location%type;
  v_previous_location public.presence.location%type;
  v_previous_seen timestamptz;
  v_enforce_baguio_geofence boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 7100));

  if p_discoverable is not true then
    delete from public.presence where user_id = auth.uid();
    return;
  end if;

  if p_latitude not between -90 and 90
    or p_longitude not between -180 and 180 then
    raise exception 'Invalid coordinates';
  end if;

  select coalesce(
    (select settings.enforce_baguio_geofence
      from public.community_settings settings
      where settings.key = 'nearby'),
    true
  ) into v_enforce_baguio_geofence;

  if v_enforce_baguio_geofence
    and (p_latitude not between 16.20 and 16.60
      or p_longitude not between 120.40 and 120.80) then
    raise exception 'Nearby is available only around Baguio';
  end if;

  v_location := extensions.st_setsrid(
    extensions.st_makepoint(p_longitude, p_latitude),
    4326
  )::extensions.geography;

  select p.location, p.last_seen
  into v_previous_location, v_previous_seen
  from public.presence p
  where p.user_id = auth.uid()
  for update;

  if found
    and v_previous_seen > now() - interval '60 seconds'
    and extensions.st_distance(v_previous_location, v_location) > 2000 then
    raise exception 'Location changed too quickly. Please try again shortly';
  end if;

  insert into public.presence (user_id, location, is_discoverable, last_seen, expires_at)
  values (
    auth.uid(),
    v_location,
    true,
    now(),
    now() + interval '90 seconds'
  )
  on conflict (user_id) do update set
    location = excluded.location,
    is_discoverable = true,
    last_seen = now(),
    expires_at = now() + interval '90 seconds';
end;
$$;

commit;
