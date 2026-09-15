-- Restore the Baguio-only server boundary after off-site radar testing.

begin;

insert into public.community_settings (key, enforce_baguio_geofence, updated_at)
values ('nearby', true, now())
on conflict (key) do update set
  enforce_baguio_geofence = excluded.enforce_baguio_geofence,
  updated_at = excluded.updated_at;

commit;
