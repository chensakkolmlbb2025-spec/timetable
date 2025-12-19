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

-- Simple check constraint to ensure repeat_days is either NULL or a JSON array
-- The application layer will validate that values are 0-6
ALTER TABLE public.time_blocks
ADD CONSTRAINT chk_repeat_days_is_array 
CHECK (
  repeat_days IS NULL 
  OR jsonb_typeof(repeat_days) = 'array'
);

-- Optional: Create a function to validate repeat_days values (for use in triggers if needed)
CREATE OR REPLACE FUNCTION public.validate_repeat_days(days jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF days IS NULL THEN
    RETURN true;
  END IF;
  
  IF jsonb_typeof(days) != 'array' THEN
    RETURN false;
  END IF;
  
  -- Check each element is a valid day index (0-6)
  RETURN NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(days) elem 
    WHERE (elem::int < 0 OR elem::int > 6)
  );
END;
$$;

-- Create a trigger to validate repeat_days on insert/update
CREATE OR REPLACE FUNCTION public.check_repeat_days_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.validate_repeat_days(NEW.repeat_days) THEN
    RAISE EXCEPTION 'repeat_days must be NULL or an array of integers 0-6';
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_check_repeat_days ON public.time_blocks;
CREATE TRIGGER trg_check_repeat_days
BEFORE INSERT OR UPDATE ON public.time_blocks
FOR EACH ROW
EXECUTE FUNCTION public.check_repeat_days_trigger();
