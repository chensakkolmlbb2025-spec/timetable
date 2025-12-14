-- Absolute Timetable - Supabase SQL schema
-- Run this script in the Supabase SQL editor or via psql
-- This script creates the core tables, constraints, indexes, and RLS policies
-- used by the Absolute Timetable application.
-- Consider running in a migration window; it includes creation of some helper functions.

-- Optional: create the categories enum and theme enum
-- Using textual type with CHECK allows simpler future modifications across languages

-- Create profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  email text,
  name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Automatically keep updated_at up-to-date
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create preferences table
CREATE TABLE IF NOT EXISTS public.preferences (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'auto' CHECK (theme IN ('light','dark','auto')),
  week_start_day smallint NOT NULL DEFAULT 1 CHECK (week_start_day IN (0,1)),
  default_day_start time NOT NULL DEFAULT '06:00',
  default_day_end time NOT NULL DEFAULT '22:00',
  notifications boolean NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_preferences_updated_at
BEFORE UPDATE ON public.preferences
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create time_blocks table
CREATE TABLE IF NOT EXISTS public.time_blocks (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  category text NOT NULL CHECK (category IN ('work','personal','health','learning','social','other')),
  color text,
  completed boolean NOT NULL DEFAULT FALSE,
  repeat_daily boolean NOT NULL DEFAULT FALSE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user_date ON public.time_blocks (user_id, date);
CREATE INDEX IF NOT EXISTS idx_time_blocks_user ON public.time_blocks (user_id);

CREATE TRIGGER set_time_blocks_updated_at
BEFORE UPDATE ON public.time_blocks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create default_templates table
CREATE TABLE IF NOT EXISTS public.default_templates (
  id uuid NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraint so a user can have at most one template per day
CREATE UNIQUE INDEX IF NOT EXISTS uq_default_templates_user_day ON public.default_templates(user_id, day_of_week);

CREATE TRIGGER set_default_templates_updated_at
BEFORE UPDATE ON public.default_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Optional: audit table for time block changes (simple audit trail)
CREATE TABLE IF NOT EXISTS public.time_blocks_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_block_id uuid NOT NULL,
  user_id uuid NOT NULL,
  operation text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_audit_time_block ON public.time_blocks_audit (time_block_id);

-- Optional: trigger to track insert/update/delete on time_blocks into audit table
CREATE OR REPLACE FUNCTION public.audit_time_blocks()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO public.time_blocks_audit (time_block_id, user_id, operation, payload)
    VALUES (OLD.id, OLD.user_id, 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.time_blocks_audit (time_block_id, user_id, operation, payload)
    VALUES (NEW.id, NEW.user_id, 'UPDATE', jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)));
    RETURN NEW;
  ELSE
    -- INSERT
    INSERT INTO public.time_blocks_audit (time_block_id, user_id, operation, payload)
    VALUES (NEW.id, NEW.user_id, 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER trg_audit_time_blocks AFTER INSERT OR UPDATE OR DELETE ON public.time_blocks
FOR EACH ROW EXECUTE FUNCTION public.audit_time_blocks();

-- SECURITY: Enable Row Level Security and policies so users only access their own rows
-- This is a minimal policy set that lets authenticated users manage their own rows.

-- Enable RLS for profiles, preferences, time_blocks, default_templates
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.default_templates ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
-- Profiles policies: ensure idempotent creation
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_public" ON public.profiles;
CREATE POLICY "profiles_insert_public" ON public.profiles
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for preferences
-- Preferences policies: idempotent create
DROP POLICY IF EXISTS "preferences_select_user" ON public.preferences;
CREATE POLICY "preferences_select_user" ON public.preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "preferences_insert_user" ON public.preferences;
CREATE POLICY "preferences_insert_user" ON public.preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "preferences_update_user" ON public.preferences;
CREATE POLICY "preferences_update_user" ON public.preferences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for time_blocks
-- Time blocks policies: idempotent create
DROP POLICY IF EXISTS "time_blocks_select_own" ON public.time_blocks;
CREATE POLICY "time_blocks_select_own" ON public.time_blocks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "time_blocks_insert" ON public.time_blocks;
CREATE POLICY "time_blocks_insert" ON public.time_blocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "time_blocks_update_own" ON public.time_blocks;
CREATE POLICY "time_blocks_update_own" ON public.time_blocks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "time_blocks_delete_own" ON public.time_blocks;
CREATE POLICY "time_blocks_delete_own" ON public.time_blocks
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for default_templates
-- Default templates policies: idempotent create
DROP POLICY IF EXISTS "default_templates_select_own" ON public.default_templates;
CREATE POLICY "default_templates_select_own" ON public.default_templates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "default_templates_insert" ON public.default_templates;
CREATE POLICY "default_templates_insert" ON public.default_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "default_templates_update_own" ON public.default_templates;
CREATE POLICY "default_templates_update_own" ON public.default_templates
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "default_templates_delete_own" ON public.default_templates;
CREATE POLICY "default_templates_delete_own" ON public.default_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Optional: create a trigger to automatically insert a profile row when a new auth user is created
-- (Supabase prefers a trigger on auth.users using a function in public schema)
-- Use SECURITY DEFINER so the trigger can insert into public.profiles even when RLS blocks
-- this operation when the caller role (e.g., auth) isn't allowed. The function will execute
-- with the privileges of the function owner (usually the DB owner).
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  -- Use to_jsonb(NEW) to safely access possible metadata fields without
  -- referencing columns that might not exist across GoTrue versions.
  new_json jsonb := to_jsonb(NEW);
  preferred_name text;
BEGIN
  -- Try several common metadata locations in order.
  preferred_name := COALESCE(
    (new_json->'raw_user_meta') ->> 'name',
    (new_json->'raw_user_meta_data') ->> 'name',
    (new_json->'user_metadata') ->> 'name',
    NEW.email
  );

  INSERT INTO public.profiles (id, email, name, created_at)
  VALUES (NEW.id, NEW.email, COALESCE(preferred_name, NEW.email), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- SAFETY: Make sure the auth schema exists and users table is present.
-- Create trigger after insert on auth.users to populate profiles if it doesn't exist.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_namespace ns JOIN pg_catalog.pg_class cl ON cl.relnamespace = ns.oid
    WHERE ns.nspname = 'auth' AND cl.relname = 'users'
  ) THEN
    BEGIN
      EXECUTE 'CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_auth_user()';
    EXCEPTION WHEN duplicate_object THEN -- trigger already exists
      RAISE NOTICE 'auth user trigger exists';
    END;
  END IF;
END;
$$;

-- Indexes for defaults & search
CREATE INDEX IF NOT EXISTS idx_default_templates_user ON public.default_templates (user_id);

-- Grant minimal SELECT/INSERT/UPDATE/DELETE permissions to the authenticated role (anon)
-- In Supabase the anon_role is often called 'anon' by default
GRANT SELECT, INSERT, UPDATE, DELETE ON public.time_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.default_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon;

-- Fin

COMMENT ON TABLE public.profiles IS 'Profile table that mirrors supabase auth users; created by triggers when auth users created.';
COMMENT ON TABLE public.time_blocks IS 'User time blocks (one per scheduled event)';
COMMENT ON TABLE public.default_templates IS 'Weekday templates for default schedule, blocks saved as JSONB list.';
COMMENT ON TABLE public.preferences IS 'User preferences for theme and default visible hours.';

-- Optional: provide an example of inserting a test user (uncomment to run locally)
-- INSERT INTO public.profiles (id, email, name) VALUES ('00000000-0000-0000-0000-000000000000', 'demo@timetable.app', 'Demo User');

-- End

-- Backwards-compatible migration: ensure repeat_daily column on time_blocks
ALTER TABLE IF EXISTS public.time_blocks ADD COLUMN IF NOT EXISTS repeat_daily boolean NOT NULL DEFAULT FALSE;
