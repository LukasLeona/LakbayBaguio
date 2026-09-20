begin;

create table if not exists public.wall_post_photos (
  post_id uuid not null references public.wall_posts(id) on delete cascade,
  position smallint not null check (position between 0 and 4),
  photo_path text not null unique,
  created_at timestamptz not null default now(),
  primary key (post_id, position)
);

alter table public.wall_post_photos enable row level security;

insert into public.wall_post_photos (post_id, position, photo_path)
select id, 0, photo_path
from public.wall_posts
where photo_path is not null
on conflict do nothing;

create or replace function public.list_wall_posts_v2(
  p_sort text default 'recent',
  p_limit integer default 40,
  p_offset integer default 0
)
returns table (
  id uuid,
  body text,
  photo_paths text[],
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
    coalesce(
      array(
        select photo.photo_path
        from public.wall_post_photos photo
        where photo.post_id = post.id
        order by photo.position
      ),
      array[]::text[]
    ) as photo_paths,
    post.created_at,
    (select count(*) from public.wall_reactions reaction where reaction.post_id = post.id)::bigint as reaction_count,
    exists (
      select 1 from public.wall_reactions reaction
      where reaction.post_id = post.id and reaction.reactor_id = auth.uid()
    ) as has_reacted,
    post.author_id = auth.uid() as is_owner
  from public.wall_posts post
  where post.status = 'visible'
  order by
    case when lower(coalesce(p_sort, 'recent')) = 'loved' then
      (select count(*) from public.wall_reactions reaction where reaction.post_id = post.id)
    else null end desc nulls last,
    post.created_at desc
  limit least(greatest(coalesce(p_limit, 40), 1), 60)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.create_wall_post_v2(
  p_body text default '',
  p_photo_paths text[] default array[]::text[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_photo_paths text[] := coalesce(p_photo_paths, array[]::text[]);
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

  if cardinality(v_photo_paths) > 5 then
    raise exception 'A Wall post can include up to five photos';
  end if;

  if v_body = '' and cardinality(v_photo_paths) = 0 then
    raise exception 'Add a message or photo';
  end if;

  if cardinality(v_photo_paths) > 0 then
    if exists (
      select 1
      from unnest(v_photo_paths) as selected(path)
      where path is null
        or path !~ ('^' || auth.uid()::text || '/[a-f0-9-]+\.(jpg|jpeg|png|webp)$')
    ) then
      raise exception 'Invalid wall photo path';
    end if;

    if (
      select count(distinct path) from unnest(v_photo_paths) as selected(path)
    ) <> cardinality(v_photo_paths) then
      raise exception 'Duplicate wall photo path';
    end if;

    if (
      select count(*)
      from storage.objects
      where bucket_id = 'wall-media'
        and name = any(v_photo_paths)
        and owner_id = auth.uid()::text
    ) <> cardinality(v_photo_paths) then
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

  if cardinality(v_photo_paths) > 0 and (
    select count(*) from public.wall_posts
    where author_id = auth.uid()
      and photo_path is not null
      and created_at > now() - interval '1 hour'
  ) >= 2 then
    raise exception 'Photo post limit reached. Please try again later';
  end if;

  insert into public.wall_posts (author_id, body, photo_path)
  values (auth.uid(), v_body, v_photo_paths[1])
  returning id into v_post_id;

  insert into public.wall_post_photos (post_id, position, photo_path)
  select v_post_id, (ordinality - 1)::smallint, path
  from unnest(v_photo_paths) with ordinality as selected(path, ordinality);

  return v_post_id;
end;
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
begin
  return public.create_wall_post_v2(
    p_body,
    case
      when nullif(btrim(coalesce(p_photo_path, '')), '') is null then array[]::text[]
      else array[p_photo_path]
    end
  );
end;
$$;

create or replace function public.delete_wall_post_v2(p_post_id uuid)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_photo_paths text[];
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  if not exists (
    select 1 from public.wall_posts
    where id = p_post_id and author_id = auth.uid()
  ) then
    raise exception 'Wall post is unavailable';
  end if;

  select coalesce(array_agg(photo_path order by position), array[]::text[])
  into v_photo_paths
  from public.wall_post_photos
  where post_id = p_post_id;

  delete from public.wall_posts where id = p_post_id;
  return v_photo_paths;
end;
$$;

revoke all on public.wall_post_photos from public, anon, authenticated;
revoke all on function public.list_wall_posts_v2(text, integer, integer) from public, anon, authenticated;
revoke all on function public.create_wall_post_v2(text, text[]) from public, anon, authenticated;
revoke all on function public.delete_wall_post_v2(uuid) from public, anon, authenticated;

grant all on public.wall_post_photos to service_role;
grant execute on function public.list_wall_posts_v2(text, integer, integer) to anon, authenticated, service_role;
grant execute on function public.create_wall_post_v2(text, text[]) to authenticated, service_role;
grant execute on function public.delete_wall_post_v2(uuid) to authenticated, service_role;

commit;
