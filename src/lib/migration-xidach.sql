-- Migration: Add game_type to rooms + Create xidach_games table
-- Run this in Supabase SQL Editor

-- 1. Add game_type column to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS game_type text DEFAULT 'loto';

-- 2. Create xidach_games table
CREATE TABLE IF NOT EXISTS public.xidach_games (
  id text PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  deck text[] DEFAULT '{}',
  dealer_id text NOT NULL,
  players jsonb DEFAULT '{}',
  dealer_cards text[] DEFAULT '{}',
  dealer_status text DEFAULT 'waiting',
  current_turn text,
  phase text DEFAULT 'waiting',
  results jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Realtime for xidach_games
ALTER PUBLICATION supabase_realtime ADD TABLE public.xidach_games;

-- 4. RLS policies for xidach_games
ALTER TABLE public.xidach_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all xidach"
ON public.xidach_games FOR SELECT USING (true);

CREATE POLICY "Enable insert for all xidach"
ON public.xidach_games FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all xidach"
ON public.xidach_games FOR UPDATE USING (true);
