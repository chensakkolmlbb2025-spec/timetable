-- Add exports log table to record automated/manual PDF sends
CREATE TABLE IF NOT EXISTS public.exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | success | failed
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  telegram_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS exports_user_date_idx ON public.exports (user_id, report_date);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.exports;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.exports FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
