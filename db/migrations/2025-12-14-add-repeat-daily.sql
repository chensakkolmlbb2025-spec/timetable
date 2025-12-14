-- Migration: Add repeat_daily column to time_blocks (if missing)
ALTER TABLE IF EXISTS public.time_blocks ADD COLUMN IF NOT EXISTS repeat_daily boolean NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.time_blocks.repeat_daily IS 'Flag to indicate if the time block repeats daily';
