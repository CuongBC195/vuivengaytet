-- =============================================
-- ROOMS TABLE (shared for all game types)
-- =============================================
create table public.rooms (
  id text primary key,
  host_id text not null,
  game_type text default 'loto',
  current_numbers integer[] default array[]::integer[],
  status text default 'waiting',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter publication supabase_realtime add table public.rooms;

alter table public.rooms enable row level security;

create policy "Enable read access for all users"
on public.rooms for select using (true);

create policy "Enable insert for all users"
on public.rooms for insert with check (true);

create policy "Enable update for all users"
on public.rooms for update using (true);

-- =============================================
-- XÌ DÁCH GAMES TABLE
-- =============================================
create table public.xidach_games (
  id text primary key references public.rooms(id) on delete cascade,
  deck text[] default '{}',
  dealer_id text not null,
  players jsonb default '{}',
  dealer_cards text[] default '{}',
  dealer_status text default 'waiting',
  current_turn text,
  phase text default 'waiting',
  results jsonb default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter publication supabase_realtime add table public.xidach_games;

alter table public.xidach_games enable row level security;

create policy "Enable read access for all xidach"
on public.xidach_games for select using (true);

create policy "Enable insert for all xidach"
on public.xidach_games for insert with check (true);

create policy "Enable update for all xidach"
on public.xidach_games for update using (true);
