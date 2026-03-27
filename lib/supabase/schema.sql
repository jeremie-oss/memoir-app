-- ============================================================
-- Memoir — Database Schema
-- Apply this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROJECTS
-- One active project per user (their memoir)
-- ============================================================
create table if not exists projects (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null default 'Mon livre',
  why              text,
  for_whom         text,
  emotional_profile jsonb,
  status           text not null default 'active'
                   check (status in ('active', 'paused', 'completed', 'archived')),
  word_count       integer not null default 0,
  passage_count    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- TRAME
-- AI-generated narrative plan (chapters/themes)
-- ============================================================
create table if not exists trame (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    jsonb not null default '[]',   -- array of {chapter, theme, prompt, status}
  version    integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PASSAGES
-- Written chapters / memoir sections
-- ============================================================
create table if not exists passages (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  content     text not null default '',
  word_count  integer not null default 0,
  chapter_ref text,    -- reference to trame chapter
  mode        text not null default 'guided'
              check (mode in ('guided', 'free', 'dictated', 'assisted')),
  status      text not null default 'draft'
              check (status in ('draft', 'revised', 'final')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- MEMORIES
-- Raw memory seeds captured during onboarding or sessions
-- ============================================================
create table if not exists memories (
  id         uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  content    text not null,
  tags       text[] default '{}',
  used       boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SESSIONS
-- Writing session logs (for streaks + analytics)
-- ============================================================
create table if not exists sessions (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references projects(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  passage_id   uuid references passages(id) on delete set null,
  words_written integer not null default 0,
  duration_sec  integer not null default 0,
  mode          text not null default 'guided',
  started_at    timestamptz not null default now(),
  ended_at      timestamptz
);

-- ============================================================
-- STREAKS
-- Daily writing streak tracking
-- ============================================================
create table if not exists streaks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  project_id      uuid not null references projects(id) on delete cascade,
  current_streak  integer not null default 0,
  longest_streak  integer not null default 0,
  last_written_at date,
  total_days      integer not null default 0,
  updated_at      timestamptz not null default now(),
  unique (user_id, project_id)
);

-- ============================================================
-- WAITLIST
-- Public signups before beta access
-- Uses anon key — insert allowed without auth
-- ============================================================
create table if not exists waitlist (
  id               uuid primary key default uuid_generate_v4(),
  email            text not null unique,
  name             text,
  source           text not null default 'unknown',
  lang             text not null default 'fr',
  session_snippet  text,
  promoted         boolean not null default false,
  created_at       timestamptz not null default now()
);

-- Anyone can sign up (no auth required)
alter table waitlist enable row level security;

create policy "waitlist_insert_public" on waitlist
  for insert with check (true);

-- Only service-role (admin API) can read
create policy "waitlist_select_service" on waitlist
  for select using (false);

-- ============================================================
-- UPDATED_AT trigger helper
-- ============================================================
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create or replace trigger trame_updated_at
  before update on trame
  for each row execute function update_updated_at();

create or replace trigger passages_updated_at
  before update on passages
  for each row execute function update_updated_at();

create or replace trigger streaks_updated_at
  before update on streaks
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table projects  enable row level security;
alter table trame     enable row level security;
alter table passages  enable row level security;
alter table memories  enable row level security;
alter table sessions  enable row level security;
alter table streaks   enable row level security;

-- Projects: users can only see/edit their own
create policy "projects_owner" on projects
  for all using (auth.uid() = user_id);

-- Trame: same
create policy "trame_owner" on trame
  for all using (auth.uid() = user_id);

-- Passages: same
create policy "passages_owner" on passages
  for all using (auth.uid() = user_id);

-- Memories: same
create policy "memories_owner" on memories
  for all using (auth.uid() = user_id);

-- Sessions: same
create policy "sessions_owner" on sessions
  for all using (auth.uid() = user_id);

-- Streaks: same
create policy "streaks_owner" on streaks
  for all using (auth.uid() = user_id);
