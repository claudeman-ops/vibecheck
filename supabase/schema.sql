-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enum types
create type session_status as enum ('collecting_ideas', 'voting', 'completed');
create type idea_category as enum ('activity', 'restaurant', 'event', 'accommodation', 'transport', 'other');

-- -------------------------------------------------------
-- TABLES
-- -------------------------------------------------------

create table public.sessions (
  id            uuid default uuid_generate_v4() primary key,
  created_by    uuid references auth.users(id) on delete set null,
  title         text not null,
  description   text,
  status        session_status not null default 'collecting_ideas',
  invite_code   text unique not null,
  destination   text,
  date_start    date,
  date_end      date,
  idea_deadline   timestamptz,
  voting_deadline timestamptz,
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

create table public.session_members (
  id           uuid default uuid_generate_v4() primary key,
  session_id   uuid references public.sessions(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  display_name text not null,
  is_host      boolean default false not null,
  joined_at    timestamptz default now() not null,
  unique(session_id, user_id)
);

create table public.ideas (
  id             uuid default uuid_generate_v4() primary key,
  session_id     uuid references public.sessions(id) on delete cascade not null,
  submitted_by   uuid references auth.users(id) on delete set null,
  title          text not null,
  description    text,
  category       idea_category not null default 'activity',
  url            text,
  estimated_cost text,
  created_at     timestamptz default now() not null
);

create table public.votes (
  id         uuid default uuid_generate_v4() primary key,
  idea_id    uuid references public.ideas(id) on delete cascade not null,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  value      integer not null check (value between 1 and 3),
  created_at timestamptz default now() not null,
  unique(idea_id, user_id)
);

-- -------------------------------------------------------
-- TRIGGERS
-- -------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sessions_updated_at
  before update on public.sessions
  for each row execute function public.handle_updated_at();

-- -------------------------------------------------------
-- HELPER FUNCTIONS
-- -------------------------------------------------------

-- Check if the calling user is a member of a session
create or replace function public.is_session_member(p_session_id uuid)
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.session_members
    where session_id = p_session_id and user_id = auth.uid()
  );
end;
$$;

-- Public preview of a session by invite code (bypasses RLS, safe to call with anon key)
create or replace function public.preview_session_by_code(p_invite_code text)
returns table (
  id           uuid,
  title        text,
  description  text,
  status       session_status,
  destination  text,
  date_start   date,
  date_end     date,
  member_count bigint,
  is_member    boolean
) language plpgsql security definer as $$
begin
  return query
  select
    s.id,
    s.title,
    s.description,
    s.status,
    s.destination,
    s.date_start,
    s.date_end,
    count(sm.id)::bigint as member_count,
    exists(
      select 1 from public.session_members
      where session_id = s.id and user_id = auth.uid()
    ) as is_member
  from public.sessions s
  left join public.session_members sm on sm.session_id = s.id
  where s.invite_code = p_invite_code
  group by s.id;
end;
$$;

-- -------------------------------------------------------
-- ROW LEVEL SECURITY
-- -------------------------------------------------------

alter table public.sessions        enable row level security;
alter table public.session_members enable row level security;
alter table public.ideas           enable row level security;
alter table public.votes           enable row level security;

-- Sessions
create policy "Members can view their sessions"
  on public.sessions for select to authenticated
  using (public.is_session_member(id));

create policy "Authenticated users can create sessions"
  on public.sessions for insert to authenticated
  with check (created_by = auth.uid());

create policy "Host can update their session"
  on public.sessions for update to authenticated
  using (created_by = auth.uid());

-- Session members
create policy "Members can view other members"
  on public.session_members for select to authenticated
  using (public.is_session_member(session_id));

create policy "Users can join sessions"
  on public.session_members for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can leave sessions"
  on public.session_members for delete to authenticated
  using (user_id = auth.uid());

-- Ideas
create policy "Members can view ideas"
  on public.ideas for select to authenticated
  using (public.is_session_member(session_id));

create policy "Members can submit ideas"
  on public.ideas for insert to authenticated
  with check (submitted_by = auth.uid() and public.is_session_member(session_id));

create policy "Submitters can update their ideas"
  on public.ideas for update to authenticated
  using (submitted_by = auth.uid());

create policy "Submitters can delete their ideas"
  on public.ideas for delete to authenticated
  using (submitted_by = auth.uid());

-- Votes
create policy "Members can view votes"
  on public.votes for select to authenticated
  using (public.is_session_member(session_id));

create policy "Members can cast votes"
  on public.votes for insert to authenticated
  with check (user_id = auth.uid() and public.is_session_member(session_id));

create policy "Users can update their own votes"
  on public.votes for update to authenticated
  using (user_id = auth.uid());

create policy "Users can delete their own votes"
  on public.votes for delete to authenticated
  using (user_id = auth.uid());
