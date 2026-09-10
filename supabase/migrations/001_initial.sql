-- BarakAPP V0.1 - esquema base para Supabase
create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  club_id uuid references public.clubs(id) on delete cascade,
  display_name text,
  role text not null default 'statistician' check (role in ('admin','coach','statistician','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  category text,
  season text,
  created_at timestamptz not null default now()
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  number int not null,
  name text not null,
  is_goalkeeper boolean not null default false,
  active boolean not null default true,
  unique(team_id, number)
);

create table if not exists public.rivals (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(club_id, name)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  rival_id uuid not null references public.rivals(id),
  match_date date not null default current_date,
  venue text not null default 'home' check (venue in ('home','away')),
  status text not null default 'draft' check (status in ('draft','live','finished')),
  period smallint not null default 1,
  period_length_minutes smallint not null default 30,
  clock_seconds int not null default 0,
  score_home int not null default 0,
  score_away int not null default 0,
  goalkeeper_id uuid references public.players(id),
  created_at timestamptz not null default now()
);

create table if not exists public.shots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  shooter_number int not null,
  zone text not null,
  goal_x numeric(6,3) not null check (goal_x between 0 and 100),
  goal_y numeric(6,3) not null check (goal_y between 0 and 100),
  result text not null check (result in ('goal','save','post_out','blocked')),
  goalkeeper_id uuid not null references public.players(id),
  match_seconds int not null,
  period smallint not null,
  created_at timestamptz not null default now()
);

create table if not exists public.exclusions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  side text not null check (side in ('home','away')),
  player_number int not null,
  player_name text,
  started_at_match_seconds int not null,
  duration_seconds int not null default 120,
  created_at timestamptz not null default now()
);

create table if not exists public.match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  event_type text not null,
  label text not null,
  match_seconds int not null,
  period smallint not null,
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.rivals enable row level security;
alter table public.matches enable row level security;
alter table public.shots enable row level security;
alter table public.exclusions enable row level security;
alter table public.match_events enable row level security;

create or replace function public.current_club_id() returns uuid language sql stable security definer set search_path = public as $$
  select club_id from public.profiles where id = auth.uid();
$$;

create policy "profiles self" on public.profiles for select using (id = auth.uid());
create policy "clubs own" on public.clubs for select using (id = public.current_club_id());
create policy "teams own" on public.teams for all using (club_id = public.current_club_id()) with check (club_id = public.current_club_id());
create policy "players own" on public.players for all using (exists(select 1 from public.teams t where t.id=team_id and t.club_id=public.current_club_id())) with check (exists(select 1 from public.teams t where t.id=team_id and t.club_id=public.current_club_id()));
create policy "rivals own" on public.rivals for all using (club_id = public.current_club_id()) with check (club_id = public.current_club_id());
create policy "matches own" on public.matches for all using (exists(select 1 from public.teams t where t.id=team_id and t.club_id=public.current_club_id())) with check (exists(select 1 from public.teams t where t.id=team_id and t.club_id=public.current_club_id()));
create policy "shots own" on public.shots for all using (exists(select 1 from public.matches m join public.teams t on t.id=m.team_id where m.id=match_id and t.club_id=public.current_club_id())) with check (exists(select 1 from public.matches m join public.teams t on t.id=m.team_id where m.id=match_id and t.club_id=public.current_club_id()));
create policy "exclusions own" on public.exclusions for all using (exists(select 1 from public.matches m join public.teams t on t.id=m.team_id where m.id=match_id and t.club_id=public.current_club_id())) with check (exists(select 1 from public.matches m join public.teams t on t.id=m.team_id where m.id=match_id and t.club_id=public.current_club_id()));
create policy "events own" on public.match_events for all using (exists(select 1 from public.matches m join public.teams t on t.id=m.team_id where m.id=match_id and t.club_id=public.current_club_id())) with check (exists(select 1 from public.matches m join public.teams t on t.id=m.team_id where m.id=match_id and t.club_id=public.current_club_id()));
