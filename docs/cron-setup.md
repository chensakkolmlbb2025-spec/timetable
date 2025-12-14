# Cron setup for Daily Telegram Export

Goal: Ensure the `api/cron/daily-report` route is called daily so the bot sends the daily PDF at 04:00 Cambodia Time (UTC+7).

Options (pick one or both):

1) GitHub Actions (recommended for most projects)

- Create/update repository secrets:
  - `CRON_TARGET_URL` - e.g. `https://your-site.vercel.app/api/cron/daily-report`
  - `CRON_SECRET` - set to the same value as your app's `CRON_SECRET` env var
The repository already includes a workflow at `.github/workflows/daily-telegram-export.yml` that:

- Runs on a schedule: `0 21 * * *` (21:00 UTC daily — that is 04:00 Cambodia Time / UTC+7).
- Posts to your `CRON_TARGET_URL` with header `x-cron-secret: <CRON_SECRET>` and validates the deployment after the call.

Setup steps:

1. Add the repo secrets in GitHub (Repository → Settings → Secrets → Actions):
  - `CRON_TARGET_URL` — full URL to your deployed cron route (e.g. `https://your-site.vercel.app/api/cron/daily-report`)
  - `CRON_SECRET` — same secret value as your app's `CRON_SECRET` env var (keeps the endpoint protected)

2. (Optional) If you want to test immediately, trigger the workflow manually from the Actions tab:
  - Open the `Daily Telegram Export` workflow and click "Run workflow" → choose branch (usually `main`) → Run.
  - Or use the GitHub CLI:

```bash
# Install/authorize `gh` and run from your repo directory
gh workflow run daily-telegram-export.yml --ref main
```

3. Inspect the workflow run logs in Actions to confirm the POST succeeded and the validation step returned `{ "ok": true }` (the workflow writes the validation output to the logs and fails if validation fails).

Troubleshooting quick checks:

- If the workflow fails at the POST step, verify `CRON_TARGET_URL` is correct and the deployed site is reachable.
- If validation fails, open the `Checks` log and look for the `/api/deploy/validate` JSON — it contains a `checks` object showing missing envs, DB issues, or Telegram getMe failures.
- You can re-run the workflow after fixing an issue.

Security and notes:

- Keep `CRON_SECRET` and `CRON_TARGET_URL` private and store them as repo secrets.
- The workflow retries the POST 3 times (curl retries) to handle transient networking issues.
- The workflow also calls the `/api/deploy/validate` endpoint after the cron POST and fails if the validation does not return `ok:true` so you'll get early feedback.

2) Vercel Cron (or other host scheduler)

- If you deploy to Vercel, configure a cron trigger in the Vercel dashboard:
  - URL: `https://<your-deployment-url>/api/cron/daily-report`
  - Method: POST
  - Headers: `x-cron-secret: <your CRON_SECRET value>`
  - Schedule: set appropriately (21:00 UTC daily).

3) Testing locally

- You can test the endpoint locally via curl:

```bash
# Load your local .env.local before running
set -a && source .env.local && set +a
curl -i -X POST "http://localhost:3000/api/cron/daily-report" -H "x-cron-secret: $CRON_SECRET"
```

- Or use the debug send endpoint in dev to send as a specific user/date:

```bash
curl -i -X POST http://localhost:3000/api/debug/send-as -H "Content-Type: application/json" -d '{"userId":"<user-id>","date":"YYYY-MM-DD"}'
```

Notes and best practices

- Idempotency: The cron route checks the `exports` table and will not re-send if a `success` record exists for that user/date.
- Retries: The cron handler will perform up to 3 attempts with short exponential backoff before giving up and sending a failure alert to the configured Telegram chat.
- Observability: Successful sends persist `telegram_message_id` and the raw `telegram_response` (if you apply the migration) to the `exports` table for troubleshooting.
- Migration: If you want to keep raw Telegram responses, apply the SQL migration `db/migrations/2025-12-14-add-telegram-response.sql` to add the `telegram_response` column.

4) Vercel specific setup

- Add the following Environment Variables in the Vercel Project settings (Production & Preview as needed):
  - `NEXT_PUBLIC_SUPABASE_URL` (public)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public)
  - `SUPABASE_SERVICE_ROLE_KEY` (production-only secret)
  - `EXPORT_DEFAULT_USER_ID` (uuid used for the automated exports)
  - `LIP_TELEGRAM_BOT_TOKEN` (secret)
  - `LIP_TELEGRAM_CHAT_ID` (secret)
  - `CRON_SECRET` (secret used to validate cron requests)
  - `ADMIN_UI_SECRET` (optional secret used to protect the admin exports UI at `/admin/exports?secret=`)

- Create a Vercel Cron Job / Scheduled Job (Project -> Settings -> Cron Jobs or use "Scheduled Functions" depending on plan):
  - Method: POST
  - URL: https://<your-deployment-url>/api/cron/daily-report
  - Header: x-cron-secret: <value of CRON_SECRET>
  - Schedule: 21:00 UTC daily (this is 04:00 Cambodia time / UTC+7)

- After deploy, validate the environment by calling the protected validate endpoint:

```bash
# Make sure CRON_SECRET is set locally or in the header
curl -i -H "x-cron-secret: $CRON_SECRET" https://<your-deployment-url>/api/deploy/validate
```

This endpoint checks that the Supabase envs, `EXPORT_DEFAULT_USER_ID` and Telegram credentials are present and attempts to call Telegram's `getMe` to verify the bot token.

If any check fails, the response contains a diagnostics object `checks` describing the issue. Resolve the missing env or DB migration and re-run the validation.

Admin UI

Visit `/admin/exports?secret=<ADMIN_UI_SECRET>` to view recent exports, see `telegram_message_id`, and download uploaded files directly from Telegram. Keep `ADMIN_UI_SECRET` private and rotate it if needed.

If you'd like, I can apply the migration to your target DB and set up the GitHub Actions secrets for you (you'd need to grant me the `DATABASE_URL` or add the secrets yourself).