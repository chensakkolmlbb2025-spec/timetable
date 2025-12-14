-- Add telegram_response field to exports table for debugging
ALTER TABLE public.exports
  ADD COLUMN IF NOT EXISTS telegram_response jsonb;
