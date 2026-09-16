begin;

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null check (char_length(title) between 5 and 100),
  body text not null check (char_length(body) between 15 and 800),
  category text not null default 'improvement' check (
    category in ('feature', 'improvement', 'content', 'accessibility', 'bug')
  ),
  status text not null default 'open' check (
    status in ('open', 'planned', 'shipped', 'closed', 'hidden')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suggestion_votes (
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  voter_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (suggestion_id, voter_id)
);

create index if not exists suggestions_created_at_idx
  on public.suggestions (created_at desc);
create index if not exists suggestions_category_created_idx
  on public.suggestions (category, created_at desc);
create index if not exists suggestion_votes_suggestion_idx
  on public.suggestion_votes (suggestion_id);

alter table public.suggestions enable row level security;
alter table public.suggestion_votes enable row level security;

create or replace function public.list_suggestions(
  p_sort text default 'top',
  p_category text default null
)
returns table (
  id uuid,
  title text,
  body text,
  category text,
  status text,
  created_at timestamptz,
  vote_count bigint,
  has_voted boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    suggestion.id,
    suggestion.title,
    suggestion.body,
    suggestion.category,
    suggestion.status,
    suggestion.created_at,
    count(vote.voter_id)::bigint as vote_count,
    (count(vote.voter_id) filter (where vote.voter_id = auth.uid()) > 0) as has_voted
  from public.suggestions suggestion
  left join public.suggestion_votes vote on vote.suggestion_id = suggestion.id
  where suggestion.status <> 'hidden'
    and (
      p_category is null
      or p_category = 'all'
      or suggestion.category = p_category
    )
  group by suggestion.id
  order by
    case
      when lower(coalesce(p_sort, 'top')) = 'top' then count(vote.voter_id)
      else null
    end desc nulls last,
    suggestion.created_at desc
  limit 200;
$$;

create or replace function public.create_suggestion(
  p_title text,
  p_body text,
  p_category text default 'improvement'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_category text := lower(btrim(coalesce(p_category, 'improvement')));
  v_suggestion_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  if not exists (select 1 from public.profiles where user_id = auth.uid()) then
    raise exception 'Anonymous profile is not ready';
  end if;

  if char_length(v_title) not between 5 and 100 then
    raise exception 'Suggestion title must be between 5 and 100 characters';
  end if;

  if char_length(v_body) not between 15 and 800 then
    raise exception 'Suggestion details must be between 15 and 800 characters';
  end if;

  if v_category not in ('feature', 'improvement', 'content', 'accessibility', 'bug') then
    raise exception 'Invalid suggestion category';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 7110));
  if (
    select count(*)
    from public.suggestions suggestion
    where suggestion.author_id = auth.uid()
      and suggestion.created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Suggestion limit reached. Please try again later';
  end if;

  insert into public.suggestions (author_id, title, body, category)
  values (auth.uid(), v_title, v_body, v_category)
  returning id into v_suggestion_id;

  return v_suggestion_id;
end;
$$;

create or replace function public.toggle_suggestion_vote(p_suggestion_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Anonymous sign-in is required';
  end if;

  if not exists (
    select 1 from public.suggestions
    where id = p_suggestion_id and status <> 'hidden'
  ) then
    raise exception 'Suggestion is unavailable';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || p_suggestion_id::text, 7111));

  if exists (
    select 1 from public.suggestion_votes
    where suggestion_id = p_suggestion_id and voter_id = auth.uid()
  ) then
    delete from public.suggestion_votes
    where suggestion_id = p_suggestion_id and voter_id = auth.uid();
    return false;
  end if;

  insert into public.suggestion_votes (suggestion_id, voter_id)
  values (p_suggestion_id, auth.uid());
  return true;
end;
$$;

revoke all on public.suggestions, public.suggestion_votes from public, anon, authenticated;
revoke all on function public.list_suggestions(text, text) from public, anon, authenticated;
revoke all on function public.create_suggestion(text, text, text) from public, anon, authenticated;
revoke all on function public.toggle_suggestion_vote(uuid) from public, anon, authenticated;

grant all on public.suggestions, public.suggestion_votes to service_role;
grant execute on function public.list_suggestions(text, text) to anon, authenticated;
grant execute on function public.create_suggestion(text, text, text) to authenticated;
grant execute on function public.toggle_suggestion_vote(uuid) to authenticated;
grant execute on function public.list_suggestions(text, text) to service_role;
grant execute on function public.create_suggestion(text, text, text) to service_role;
grant execute on function public.toggle_suggestion_vote(uuid) to service_role;

commit;
