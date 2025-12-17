# ✅ GitHub Workflow Verification for Vercel Deployment

**Site URL:** https://timetable-one-azure.vercel.app  
**Repository:** chensakkolmlbb2025-spec/timetable  
**Date:** December 17, 2025

---

## 📋 Workflow Configuration Status

### ✅ Workflows Found & Configured

1. **🤖 Daily Telegram Export** (`daily-telegram-export.yml`)
   - **Schedule:** 3 times daily (21:00, 21:15, 21:30 UTC = 04:00, 04:15, 04:30 Cambodia)
   - **Retries:** 3 attempts per schedule (9 total)
   - **Status:** ✅ Configured correctly
   - **Target:** Uses `CRON_TARGET_URL` secret

2. **🔄 Backup Daily Export** (`backup-telegram-export.yml`)
   - **Schedule:** Once daily (23:00 UTC = 06:00 Cambodia)
   - **Purpose:** Safety net if primary fails
   - **Status:** ✅ Configured correctly
   - **Target:** Uses `CRON_TARGET_URL` secret

---

## 🔐 Required GitHub Secrets

The following secrets **MUST** be set in your GitHub repository:

**Path:** https://github.com/chensakkolmlbb2025-spec/timetable/settings/secrets/actions

### Critical Secrets:

| Secret Name | Purpose | Example Value | Status |
|-------------|---------|---------------|--------|
| `CRON_TARGET_URL` | Your Vercel deployment URL | `https://timetable-one-azure.vercel.app` | ⚠️ **VERIFY** |
| `CRON_SECRET` | Secret key for cron authentication | `<random-string>` | ⚠️ **VERIFY** |

### How to Verify Secrets:

1. Go to: https://github.com/chensakkolmlbb2025-spec/timetable/settings/secrets/actions
2. Check if these secrets exist:
   - ✅ `CRON_TARGET_URL` should be set to `https://timetable-one-azure.vercel.app`
   - ✅ `CRON_SECRET` should match the value in your Vercel environment variables

### How to Set/Update Secrets:

```bash
# Go to GitHub repository
1. Click "Settings" tab
2. Click "Secrets and variables" → "Actions"
3. Click "New repository secret" or "Update" existing
4. Add:
   Name: CRON_TARGET_URL
   Value: https://timetable-one-azure.vercel.app
   
5. Add/Update:
   Name: CRON_SECRET
   Value: <your-cron-secret-from-vercel>
```

---

## 🌐 Vercel Environment Variables

These must match your GitHub secrets:

**Path:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `CRON_SECRET` | ✅ Yes | Must match GitHub `CRON_SECRET` |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase admin key |
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | Your Telegram bot token |
| `TELEGRAM_CHAT_ID` | ✅ Yes | Your Telegram chat ID |

---

## 🧪 Testing the Workflow

### Manual Trigger Test:

1. **Go to Actions:**  
   https://github.com/chensakkolmlbb2025-spec/timetable/actions

2. **Select Workflow:**
   - Click "🤖 Daily Telegram Export - Ultimate Edition"

3. **Run Workflow:**
   - Click "Run workflow" button (top right)
   - Select branch: `main`
   - Leave "Force retry" unchecked (or check to override idempotency)
   - Click green "Run workflow" button

4. **Monitor Progress:**
   - Wait 30 seconds, then refresh the page
   - Click on the running workflow to see live logs
   - Look for: ✅ "SUCCESS: Report sent successfully"

5. **Check Telegram:**
   - You should receive a PDF within 1-2 minutes

### Expected Output (Success):

```
🔍 Check environment & if already sent today
  ✅ Environment configured correctly
  📤 No successful send found, will proceed

🚀 Send Daily Report (Attempt 1)
  📡 Calling https://timetable-one-azure.vercel.app/api/cron/daily-report
  📨 Response: {"success":true,"message":"Report sent successfully"}
  ✅ SUCCESS: Report sent successfully

✅ Validate deployment health
  🔍 Validating deployment health...
  ✅ Deployment is healthy

📊 Final Status Summary
  Status: ✅ SUCCESS (Attempt 1)
```

---

## 🐛 Troubleshooting Common Issues

### Issue 1: "CRON_TARGET_URL secret is not set"

**Solution:**
```bash
1. Go to https://github.com/chensakkolmlbb2025-spec/timetable/settings/secrets/actions
2. Click "New repository secret"
3. Name: CRON_TARGET_URL
4. Value: https://timetable-one-azure.vercel.app
5. Click "Add secret"
```

### Issue 2: "401 Unauthorized" or "CRON_SECRET mismatch"

**Solution:**
```bash
1. Check GitHub secret matches Vercel env variable
2. In Vercel dashboard, copy your CRON_SECRET value
3. Update GitHub secret to match exactly
4. Re-run workflow
```

### Issue 3: "Deployment validation failed"

**Solution:**
```bash
1. Check Vercel deployment status
2. Visit https://timetable-one-azure.vercel.app/api/deploy/validate
3. Should return: {"ok":true,...}
4. If not, check Vercel logs for errors
```

### Issue 4: "All 3 attempts failed"

**Possible Causes:**
- Vercel deployment is down
- Supabase connection issue
- Telegram bot token invalid
- Environment variables misconfigured

**Debug Steps:**
```bash
1. Test deployment health:
   curl https://timetable-one-azure.vercel.app/api/deploy/validate
   
2. Check Vercel logs:
   https://vercel.com/dashboard → Your Project → Deployments → Logs
   
3. Test manual export from UI:
   https://timetable-one-azure.vercel.app/export
   
4. Verify all environment variables are set correctly
```

---

## 📊 Monitoring & Alerts

### GitHub Actions Status:
- **URL:** https://github.com/chensakkolmlbb2025-spec/timetable/actions
- **Email Notifications:** GitHub sends emails on workflow failures
- **Issue Creation:** Workflow automatically creates GitHub issue on failure

### Workflow Artifacts:
- Each run uploads attempt logs as artifacts
- Download from: Workflow run → Artifacts section
- Contains JSON responses from all attempts

### Auto-Created Issues:
- On failure, workflow creates issue with label `type: incident` and `cron`
- Issue includes run URL and artifact links
- Check: https://github.com/chensakkolmlbb2025-spec/timetable/issues

---

## ✅ Final Verification Checklist

- [ ] `CRON_TARGET_URL` secret set to `https://timetable-one-azure.vercel.app`
- [ ] `CRON_SECRET` secret matches Vercel environment variable
- [ ] Vercel deployment is live and accessible
- [ ] All Vercel environment variables are set
- [ ] Manual workflow trigger test completed successfully
- [ ] Telegram PDF received during test
- [ ] Deployment validation returns `{"ok":true}`

---

## 🎯 Next Steps

1. **Set GitHub Secrets** (if not already done):
   - Visit: https://github.com/chensakkolmlbb2025-spec/timetable/settings/secrets/actions
   - Add/verify `CRON_TARGET_URL` and `CRON_SECRET`

2. **Test Manually:**
   - Trigger workflow manually to verify everything works
   - Check Telegram for PDF delivery

3. **Monitor Daily:**
   - Check GitHub Actions tab daily at first
   - After 1 week of successful runs, can check less frequently
   - GitHub will email you if workflow fails

4. **Review Workflow Logs:**
   - Periodically review logs to catch any warnings
   - Download artifacts if debugging needed

---

## 📚 Additional Resources

- **Workflow Details:** See `/docs/workflow-monitoring.md`
- **Cron Setup:** See `/docs/cron-setup.md`
- **Deployment Info:** See `/docs/deployment-summary.md`

