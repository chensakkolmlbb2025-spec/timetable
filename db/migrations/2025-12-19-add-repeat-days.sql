-- Migration: Add repeat_days column for weekly repeating tasks
-- This allows users to schedule tasks that repeat on specific days of the week
-- repeat_days is stored as a JSONB array of integers: [0,1,2,3,4,5,6]
-- where 0 = Sunday, 1 = Monday, ..., 6 = Saturday

-- Add repeat_days column to time_blocks table
ALTER TABLE public.time_blocks
ADD COLUMN IF NOT EXISTS repeat_days jsonb DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.time_blocks.repeat_days IS 
  'Array of day indices (0=Sunday to 6=Saturday) when this block repeats. NULL means no weekly repeat (use repeat_daily for daily). Example: [1,3,5] for Mon/Wed/Fri';

-- Create an index for faster querying of repeat blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_repeat_days 
ON public.time_blocks USING GIN (repeat_days) 
WHERE repeat_days IS NOT NULL;

-- Optional: Add a check constraint to validate the array values
-- This ensures only valid day indices (0-6) are stored
ALTER TABLE public.time_blocks
ADD CONSTRAINT chk_repeat_days_valid 
CHECK (
  repeat_days IS NULL 
  OR (
    jsonb_typeof(repeat_days) = 'array' 
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(repeat_days) elem 
      WHERE (elem::int < 0 OR elem::int > 6)
    )
  )
);
