-- BarakAPP v0.3 - esquema servidor simplificado
create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.club_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  display_name text,
  role text not null default 'coach' check (role in ('admin','coach','viewer')),
  created_at timestamptz not null default now()
);

create table if not exists public.app_state (
  club_id uuid primary key references public.clubs(id) on delete cascade,
  state jsonb not null default '{"teams":[],"matches":[],"rivals":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.app_state enable row level security;

create or replace function public.current_club_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select club_id from public.club_members where user_id = auth.uid();
$$;

create policy "members can read own membership"
on public.club_members for select
using (user_id = auth.uid());

create policy "members can read own club"
on public.clubs for select
using (id = public.current_club_id());

create policy "members can read club state"
on public.app_state for select
using (club_id = public.current_club_id());

create or replace function public.save_current_club_state(new_state jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
begin
  cid := public.current_club_id();
  if cid is null then
    raise exception 'El usuario no pertenece a ningún club';
  end if;

  insert into public.app_state (club_id, state, updated_at, updated_by)
  values (cid, new_state, now(), auth.uid())
  on conflict (club_id) do update
    set state = excluded.state,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by;
end;
$$;

revoke all on function public.save_current_club_state(jsonb) from public;
grant execute on function public.save_current_club_state(jsonb) to authenticated;

-- Puesta en marcha inicial:
-- 1) Crear al primer usuario desde Authentication > Users.
-- 2) Ejecutar una vez en SQL Editor sustituyendo los valores:
--
-- with new_club as (
--   insert into public.clubs(name) values ('Balonmano Barakaldo') returning id
-- )
-- insert into public.club_members(user_id, club_id, display_name, role)
-- select 'UUID_DEL_USUARIO'::uuid, id, 'Administrador', 'admin' from new_club;
--
-- Para añadir después más usuarios al mismo club:
-- insert into public.club_members(user_id, club_id, display_name, role)
-- select 'UUID_NUEVO_USUARIO'::uuid, id, 'Entrenador', 'coach'
-- from public.clubs where name = 'Balonmano Barakaldo' limit 1;
