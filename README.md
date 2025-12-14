This is the "Absolute Timetable" web app — a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Database migrations (quick)

If you need to add the new DB column (`repeat_daily`) to the `time_blocks` table, there are two ways:

1) Run the migration script with a Postgres connection URL (local Supabase/Postgres):

```bash
DATABASE_URL=postgres://<user>:<pass>@<host>:5432/<db> npm run migrate db/migrations/2025-12-14-add-repeat-daily.sql
```

2) Run the SQL directly in the Supabase SQL editor (copy the contents of `db/migrations/2025-12-14-add-repeat-daily.sql`) and execute in your Supabase project.

Note: Use caution in production — test locally and consider a proper migration workflow (like Supabase CLI migrations) for long-term consistency.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase configuration

This project uses Supabase for authentication and persistent storage. Add the following environment variables to `.env.local` (or your hosting environment). Don't commit `.env.local` to source control — it is included in `.gitignore`.

Required environment variables:

- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL (example: `https://xyzabc123.supabase.co`).
- NEXT_PUBLIC_SUPABASE_ANON_KEY: The public anon key. This is safe to expose client-side as a `NEXT_PUBLIC_` variable.
- SUPABASE_SERVICE_ROLE_KEY: Optional. Service role key used for admin operations on the server only. Do not expose this to the client.

How to get the keys:

1. Open your Supabase project dashboard.
2. Go to Settings → API.
3. The `Project URL` is your `NEXT_PUBLIC_SUPABASE_URL`.
4. The `anon` (public) key is the `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. The `service_role` key should be used only on the server and set as `SUPABASE_SERVICE_ROLE_KEY` in production.

Example `.env.local` (copy `.env.example` to `.env.local` and fill in values):

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-public-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

Security note: The service role key has broad permissions (including reading/writing any row). Use it only on trusted server environments. If you need server admin calls while honoring RLS, consider using Supabase server SDKs or the service role key in guarded server endpoints.

## Troubleshooting: "Database error saving new user"

If you encounter a message like "Database error saving new user" during sign up, here are the common causes and steps to fix them:

- RLS (Row Level Security) or missing INSERT/UPDATE policy: Make sure your `profiles` table has a policy that allows authenticated users to create their own profile, or run a server-side creation using the service role key. See `db/supabase-schema.sql` for a sample policy.
- Missing profiles table or trigger: If the `profiles` table hasn't been created or the `handle_new_auth_user` trigger is not present, the client-side upsert may fail. Apply the `db/supabase-schema.sql` script via Supabase SQL Editor or as a migration.
- Upsert attempted before session exists: The Supabase signUp flow may or may not create a session immediately (e.g., when email confirmation is required). The client-side upsert will only be attempted when a session is present. If it fails due to RLS on update, consider using a server-side route that uses the service role key to create the profile.
- Server function permissions: The trigger function `handle_new_auth_user` should be `SECURITY DEFINER` so it can insert profiles irrespective of the caller role. The migration already sets that flag.

If you need help debugging, check the following:

1. Open the Supabase project → Database → Table Editor and verify `public.profiles` exists.
2. Check the project's Row Level Security policies under Database → Policies for `public.profiles`.
3. Confirm the `auth.users` trigger exists and the `public.handle_new_auth_user` function is set to `SECURITY DEFINER`.
4. Check the browser console and server logs for specific error messages returned by Supabase; those often point to 'permission denied' or 'relation does not exist'.

If you'd like, I can add a server endpoint that creates the profile with the service role key (secure server-only route), or add more resilient client-side fallback logic.

Note: This project includes a secure fallback route accessible at `/api/profiles/upsert` that uses the `SUPABASE_SERVICE_ROLE_KEY` to upsert a `profiles` row if client-side upsert fails due to RLS. The route requires the user's `access_token` in the `x-supabase-access-token` header and will validate the token corresponds to the user id before performing the admin upsert.


# AbsoluteTimetable
# AbsoluteTimetable
