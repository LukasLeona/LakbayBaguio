begin;

create table if not exists public.wall_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  body text not null default '' check (char_length(body) <= 1500),
  photo_path text,
  status text not null default 'visible' check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(btrim(body)) > 0 or photo_path is not null)
);

create table if not exists public.wall_reactions (
  post_id uuid not null references public.wall_posts(id) on delete cascade,
  reactor_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, reactor_id)
);

create table if not exists public.wall_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.wall_posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(user_id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'unsafe', 'private_information', 'other')),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create index if not exists wall_posts_created_idx on public.wall_posts (created_at desc) where status = 'visible';
create index if not exists wall_reactions_post_idx on public.wall_reactions (post_id);
create index if not exists wall_reports_post_idx on public.wall_reports (post_id);

alter table public.wall_posts enable row level security;
alter table public.wall_reactions enable row level security;
alter table public.wall_reports enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-media',
  'wall-media',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "wall media public read" on storage.objects;
create policy "wall media public read"
on storage.objects for select
to public
using (bucket_id = 'wall-media');

drop policy if exists "wall media authenticated upload" on storage.objects;
create policy "wall media authenticated upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'wall-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "wall media owner delete" on storage.objects;
create policy "wall media owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'wall-media'
  and owner_id = auth.uid()::text
);

create or replace function public.list_wall_posts(
  p_sort text default 'recent',
  p_limit integer default 40,
  p_offset integer default 0
)
returns table (
  id uuid,
  body text,
  photo_path text,
  created_at timestamptz,
  reaction_count bigint,
  has_reacted boolean,
  is_owner boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    post.id,
    post.body,
    post.photo_path,
    post.created_at,
    count(reaction.reactor_id)::bigint as reaction_count,
    (count(reaction.reactor_id) filter (where reaction.reactor_id = auth.uid()) > 0) as has_reacted,
    (post.author_id = auth.uid()) as is_owner
  from public.wall_posts post
  left join public.wall_reactions reaction on reaction.post_id = post.id
  where post.status = 'visible'
  group by post.id
  order by
    case when lower(coalesce(p_sort, 'recent')) = 'loved' then count(reaction.reactor_id) else null end desc nulls last,
    post.created_at desc
  limit least(greatest(coalesce(p_limit, 40), 1), 60)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.create_wall_post(
  p_body text default '',
  p_photo_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_photo_path text := nullif(btrim(coalesce(p_photo_path, '')), '');
  v_post_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  if not exists (select 1 from public.profiles where user_id = auth.uid()) then
    raise exception 'Anonymous profile is not ready';
  end if;

  if char_length(v_body) > 1500 then
    raise exception 'Wall post is too long';
  end if;

  if v_body = '' and v_photo_path is null then
    raise exception 'Add a message or photo';
  end if;

  if v_photo_path is not null then
    if v_photo_path !~ ('^' || auth.uid()::text || '/[a-f0-9-]+\.(jpg|jpeg|png|webp)$') then
      raise exception 'Invalid wall photo path';
    end if;
    if not exists (
      select 1 from storage.objects
      where bucket_id = 'wall-media' and name = v_photo_path and owner_id = auth.uid()::text
    ) then
      raise exception 'Wall photo was not uploaded';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 7130));
  if (
    select count(*) from public.wall_posts
    where author_id = auth.uid() and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'Wall post limit reached. Please try again later';
  end if;

  if v_photo_path is not null and (
    select count(*) from public.wall_posts
    where author_id = auth.uid()
      and photo_path is not null
      and created_at > now() - interval '1 hour'
  ) >= 2 then
    raise exception 'Photo post limit reached. Please try again later';
  end if;

  insert into public.wall_posts (author_id, body, photo_path)
  values (auth.uid(), v_body, v_photo_path)
  returning id into v_post_id;

  return v_post_id;
end;
$$;

create or replace function public.toggle_wall_reaction(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  if not exists (select 1 from public.wall_posts where id = p_post_id and status = 'visible') then
    raise exception 'Wall post is unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || p_post_id::text, 7131));
  if exists (
    select 1 from public.wall_reactions where post_id = p_post_id and reactor_id = auth.uid()
  ) then
    delete from public.wall_reactions where post_id = p_post_id and reactor_id = auth.uid();
    return false;
  end if;

  insert into public.wall_reactions (post_id, reactor_id) values (p_post_id, auth.uid());
  return true;
end;
$$;

create or replace function public.delete_wall_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_photo_path text;
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  delete from public.wall_posts
  where id = p_post_id and author_id = auth.uid()
  returning photo_path into v_photo_path;

  if not found then
    raise exception 'Wall post is unavailable';
  end if;

  return v_photo_path;
end;
$$;

create or replace function public.report_wall_post(p_post_id uuid, p_reason text default 'other')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := lower(btrim(coalesce(p_reason, 'other')));
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  if v_reason not in ('spam', 'harassment', 'unsafe', 'private_information', 'other') then
    raise exception 'Invalid report reason';
  end if;

  if not exists (select 1 from public.wall_posts where id = p_post_id and status = 'visible') then
    raise exception 'Wall post is unavailable';
  end if;

  insert into public.wall_reports (post_id, reporter_id, reason)
  values (p_post_id, auth.uid(), v_reason)
  on conflict (post_id, reporter_id) do update set reason = excluded.reason, created_at = now();
end;
$$;

revoke all on public.wall_posts, public.wall_reactions, public.wall_reports from public, anon, authenticated;
revoke all on function public.list_wall_posts(text, integer, integer) from public, anon, authenticated;
revoke all on function public.create_wall_post(text, text) from public, anon, authenticated;
revoke all on function public.toggle_wall_reaction(uuid) from public, anon, authenticated;
revoke all on function public.delete_wall_post(uuid) from public, anon, authenticated;
revoke all on function public.report_wall_post(uuid, text) from public, anon, authenticated;

grant all on public.wall_posts, public.wall_reactions, public.wall_reports to service_role;
grant execute on function public.list_wall_posts(text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.create_wall_post(text, text) to authenticated, service_role;
grant execute on function public.toggle_wall_reaction(uuid) to authenticated, service_role;
grant execute on function public.delete_wall_post(uuid) to authenticated, service_role;
grant execute on function public.report_wall_post(uuid, text) to authenticated, service_role;

commit;
