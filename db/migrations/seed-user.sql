-- SQL seed to create a matching profile and default preferences for the seeded auth user.
-- Usage:
-- 1. Create the auth user with the admin script: scripts/create-supabase-user.js
--    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-supabase-user.js
-- 2. Run this SQL in the Supabase SQL editor or via psql to insert the profile and preferences.

-- Replace the USER_ID below if you used a different id when creating the auth user.
\set USER_ID 'b3d9f5c4-2a1e-4f7b-9c8d-1234567890ab'
\set EMAIL 'chensakkol1124@gmail.com'
\set NAME 'Chen Sakkol'

INSERT INTO public.profiles (id, email, name, created_at)
VALUES (:'USER_ID'::uuid, :'EMAIL', :'NAME', now())
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = EXCLUDED.name,
      updated_at = now();

INSERT INTO public.preferences (user_id, theme, week_start_day, default_day_start, default_day_end, notifications, created_at)
VALUES (:'USER_ID'::uuid, 'auto', 1, '06:00', '22:00', TRUE, now())
ON CONFLICT (user_id) DO UPDATE
  SET theme = EXCLUDED.theme,
      week_start_day = EXCLUDED.week_start_day,
      default_day_start = EXCLUDED.default_day_start,
      default_day_end = EXCLUDED.default_day_end,
      notifications = EXCLUDED.notifications,
      updated_at = now();

SELECT 'Seed complete for user id: ' || :'USER_ID' as result;
