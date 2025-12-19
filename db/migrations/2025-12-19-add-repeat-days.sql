-- Migration: Add repeat_days column for weekly repeating tasks
-- This allows users to schedule tasks that repeat on specific days of the week
-- repeat_days is stored as a JSONB array of integers: [0,1,2,3,4,5,6]
-- where 0 = Sunday, 1 = Monday, ..., 6 = Saturday

-- Step 1: Add repeat_days column to time_blocks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'time_blocks' 
    AND column_name = 'repeat_days'
  ) THEN
    ALTER TABLE public.time_blocks
    ADD COLUMN repeat_days jsonb DEFAULT NULL;
  END IF;
END $$;

-- Step 2: Add a comment explaining the column
COMMENT ON COLUMN public.time_blocks.repeat_days IS 
  'Array of day indices (0=Sunday to 6=Saturday) when this block repeats. NULL means no weekly repeat (use repeat_daily for daily). Example: [1,3,5] for Mon/Wed/Fri';

-- Step 3: Create an index for faster querying of repeat blocks
CREATE INDEX IF NOT EXISTS idx_time_blocks_repeat_days 
ON public.time_blocks USING GIN (repeat_days) 
WHERE repeat_days IS NOT NULL;

-- Step 4: Add check constraint to ensure repeat_days is either NULL or a JSON array
-- Note: We avoid complex validation here to prevent constraint issues
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.time_blocks
    ADD CONSTRAINT chk_repeat_days_is_array 
    CHECK (repeat_days IS NULL OR jsonb_typeof(repeat_days) = 'array');
  EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists, ignore
    NULL;
  END;
END $$;
