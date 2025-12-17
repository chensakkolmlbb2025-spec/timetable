# 🕐 Vercel Cron Setup Guide

**Last Updated:** December 17, 2025  
**Site:** https://timetable-one-azure.vercel.app

---

## 📋 Overview

Your daily Telegram export now uses **Vercel Cron Jobs** instead of GitHub Actions. This is the recommended approach for Vercel-hosted applications because:

✅ **Native Integration** - Built into Vercel platform  
✅ **Better Reliability** - Runs on Vercel's infrastructure  
✅ **Simpler Setup** - No GitHub secrets needed  
✅ **Automatic Authentication** - Vercel handles security  
✅ **Better Monitoring** - View logs in Vercel dashboard  

---

## ⚙️ Configuration

### vercel.json

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 21 * * *"
    }
  ]
}
```

**Schedule:** `0 21 * * *`
- **Time:** 21:00 UTC = **04:00 Cambodia Time (UTC+7)**
- **Frequency:** Every day
- **Format:** Standard cron syntax (minute hour day month weekday)

### Schedule Examples

If you want to change the time:

```
0 21 * * *   →  04:00 Cambodia (current)
0 20 * * *   →  03:00 Cambodia
0 22 * * *   →  05:00 Cambodia
30 21 * * *  →  04:30 Cambodia
```

---

## 🔐 Authentication

### Environment Variable Required

**In Vercel Dashboard:**  
Settings → Environment Variables → Add

| Variable | Value | Purpose |
|----------|-------|---------|
| `CRON_SECRET` | `<random-string>` | Authenticates cron requests |

**Generate a secure secret:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online
# https://www.random.org/strings/
```

### How Authentication Works

1. **Vercel Cron** → Automatically adds `Authorization: Bearer <CRON_SECRET>` header
2. **Your API Route** → Validates the header matches environment variable
3. **Manual Triggers** → Can use `x-cron-secret` header for testing

---

## 🚀 Deployment

### Step 1: Deploy to Vercel

The `vercel.json` file is automatically detected during deployment:

```bash
# Automatic deployment via Git push
git add vercel.json
git commit -m "feat: Add Vercel Cron configuration"
git push origin main

# Or manual deployment
vercel --prod
```

### Step 2: Verify Cron Registration

After deployment:

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** tab
3. Click **Crons** in sidebar
4. You should see:
   ```
   /api/cron/daily-report
   Schedule: 0 21 * * *
   Status: Active
   ```

### Step 3: Set Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Add `CRON_SECRET` with your generated secret
3. Apply to: **Production, Preview, Development**
4. Click **Save**
5. **Redeploy** to apply the new environment variable

---

## 🧪 Testing

### Option 1: Manual Trigger (Recommended)

```bash
# Test with your CRON_SECRET
curl -X POST https://timetable-one-azure.vercel.app/api/cron/daily-report \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json"

# Expected response:
{"success":true}
```

### Option 2: Test via Vercel Dashboard

1. Go to **Settings** → **Crons**
2. Click on your cron job
3. Click **Trigger** button
4. Check **Logs** tab to see execution

### Option 3: Wait for Scheduled Run

The cron will automatically run at 04:00 Cambodia time (21:00 UTC) daily.

---

## 📊 Monitoring

### View Cron Executions

**Vercel Dashboard:**
1. Go to your project
2. Click **Logs** tab
3. Filter by: `/api/cron/daily-report`
4. View execution history and results

### Expected Log Output (Success)

```
POST /api/cron/daily-report 200 in 2.3s
cron/daily-report: send attempt 1 succeeded via file messageId= 12345
cron/daily-report: delivered via file messageId= 12345
```

### Expected Log Output (Already Sent)

```
POST /api/cron/daily-report 200 in 0.5s
Response: {"success":true,"message":"Already sent"}
```

### Error Monitoring

Vercel automatically sends email notifications on cron failures.

**Configure notifications:**
1. Go to **Settings** → **Notifications**
2. Enable "Deployment Errors"
3. Add your email

---

## 🔧 Troubleshooting

### Issue 1: Cron Not Appearing in Dashboard

**Solution:**
1. Check `vercel.json` syntax is valid
2. Ensure file is in repository root
3. Redeploy the project
4. Refresh Vercel dashboard

### Issue 2: "Unauthorized" Error

**Solution:**
```bash
# 1. Verify CRON_SECRET is set in Vercel
Settings → Environment Variables → Check CRON_SECRET exists

# 2. Redeploy to apply environment variable
Deployments → Latest → Redeploy

# 3. Test with correct secret
curl -X POST https://timetable-one-azure.vercel.app/api/cron/daily-report \
  -H "Authorization: Bearer YOUR_ACTUAL_SECRET"
```

### Issue 3: Cron Runs But Fails

**Check these in order:**

1. **Environment Variables:**
   ```
   ✅ CRON_SECRET
   ✅ EXPORT_DEFAULT_USER_ID
   ✅ NEXT_PUBLIC_SUPABASE_URL
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
   ✅ SUPABASE_SERVICE_ROLE_KEY
   ✅ TELEGRAM_BOT_TOKEN
   ✅ TELEGRAM_CHAT_ID
   ```

2. **Check Logs:**
   - Vercel Dashboard → Logs
   - Look for error messages

3. **Test Manually:**
   ```bash
   # Test the endpoint works
   curl -X POST https://timetable-one-azure.vercel.app/api/cron/daily-report \
     -H "Authorization: Bearer YOUR_SECRET"
   ```

### Issue 4: No PDF Received in Telegram

**Debug steps:**

1. **Check Telegram Config:**
   ```bash
   # Verify bot token and chat ID are valid
   # Test bot manually at https://timetable-one-azure.vercel.app/export
   ```

2. **Check Export Record:**
   - Check Supabase `exports_log` table
   - Look for status and error messages

3. **Verify Time Blocks Exist:**
   - Ensure you have time blocks for the current date
   - Check `time_blocks` table in Supabase

---

## 🔄 Migration from GitHub Actions

### What Changed

| Aspect | GitHub Actions (Old) | Vercel Cron (New) |
|--------|---------------------|-------------------|
| **Configuration** | `.github/workflows/*.yml` | `vercel.json` |
| **Scheduling** | Multiple schedules + retries | Single schedule |
| **Authentication** | GitHub secret | Vercel environment variable |
| **Monitoring** | GitHub Actions tab | Vercel Dashboard |
| **Retries** | 3 attempts per schedule | Built-in retry in API |
| **Logs** | GitHub artifacts | Vercel logs |

### GitHub Actions Status

The GitHub Actions workflows (`.github/workflows/`) are **no longer needed** but kept for reference.

You can:
- **Disable them** in GitHub Settings → Actions
- **Delete them** if you're confident in Vercel Cron
- **Keep them** as backup (they won't run unless manually triggered)

### To Disable GitHub Actions Workflows

1. Go to: https://github.com/chensakkolmlbb2025-spec/timetable/settings/actions
2. Select "Disable actions"
3. Or go to each workflow and click "Disable workflow"

---

## ⏰ Schedule Reference

| Time (UTC) | Time (Cambodia) | When |
|------------|-----------------|------|
| 21:00 | 04:00 | Early morning |
| 20:00 | 03:00 | Very early morning |
| 22:00 | 05:00 | Morning |
| 14:00 | 21:00 | Evening |

**Cambodia is UTC+7**

---

## 📈 Advanced Configuration

### Multiple Cron Jobs

You can add multiple cron jobs in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 21 * * *"
    },
    {
      "path": "/api/cron/weekly-summary",
      "schedule": "0 22 * * 0"
    }
  ]
}
```

### Conditional Execution

Add logic in your API route:

```typescript
// Only run on weekdays
const today = new Date()
const dayOfWeek = today.getDay() // 0 = Sunday, 6 = Saturday
if (dayOfWeek === 0 || dayOfWeek === 6) {
  return NextResponse.json({ success: true, message: "Skipped: Weekend" })
}
```

### Custom Timezones

Vercel Cron runs in UTC. Calculate your desired time:

```
Cambodia Time (UTC+7): 04:00
UTC Time: 04:00 - 7 = 21:00
Cron: 0 21 * * *
```

---

## ✅ Verification Checklist

- [ ] `vercel.json` created in repository root
- [ ] Cron schedule configured (e.g., `0 21 * * *`)
- [ ] `CRON_SECRET` environment variable set in Vercel
- [ ] All other required environment variables set
- [ ] Deployed to Vercel
- [ ] Cron appears in Vercel Dashboard → Settings → Crons
- [ ] Manual test successful
- [ ] Verified in Telegram
- [ ] GitHub Actions workflows disabled (optional)

---

## 🎯 Summary

**Vercel Cron Benefits:**
- ✅ Simpler setup (no GitHub secrets)
- ✅ Better integration with Vercel
- ✅ Centralized monitoring
- ✅ Automatic authentication
- ✅ Production-grade reliability

**Next Steps:**
1. Deploy with `vercel.json`
2. Set `CRON_SECRET` environment variable
3. Verify cron appears in dashboard
4. Test manually
5. Wait for scheduled run or trigger manually

---

## 📚 Resources

- **Vercel Cron Docs:** https://vercel.com/docs/cron-jobs
- **Cron Syntax Guide:** https://crontab.guru
- **Your Vercel Dashboard:** https://vercel.com/dashboard
- **API Route:** `/app/api/cron/daily-report/route.ts`

---

## 🆘 Support

**If cron doesn't work:**
1. Check Vercel Dashboard → Logs for errors
2. Verify all environment variables are set
3. Test endpoint manually with curl
4. Check Telegram bot token is valid
5. Verify Supabase connection works

**Common Issues:**
- Missing environment variables
- Invalid cron syntax in vercel.json
- CRON_SECRET not set or mismatched
- Time blocks don't exist for the date
