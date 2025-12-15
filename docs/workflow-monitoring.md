# 🔍 Ultimate Workflow Monitoring Guide

## Overview

Your Telegram daily export system now has **QUADRUPLE REDUNDANCY** to ensure zero missed days:

### 🎯 Primary Workflow (3 schedules × 3 retries = 9 attempts)
- **04:00 Cambodia** (21:00 UTC) - 3 retry attempts
- **04:15 Cambodia** (21:15 UTC) - 3 retry attempts  
- **04:30 Cambodia** (21:30 UTC) - 3 retry attempts

### 🆘 Backup Workflow (1 schedule × 10 retries = 10 attempts)
- **06:00 Cambodia** (23:00 UTC) - Only runs if primary failed

**Total Safety Net: 19 send attempts per day**

---

## 📊 How to Monitor

### Method 1: GitHub Actions Dashboard

1. Go to: https://github.com/chensakkolmlbb2025-spec/timetable/actions
2. Look for workflows:
   - ⏰ **Daily Telegram Export** (primary)
   - 🔄 **Backup Daily Export** (safety net)
3. Check status:
   - ✅ Green = Success
   - ❌ Red = Failed (backup should activate)
   - 🟡 Yellow = Running

### Method 2: Telegram Messages

- You should receive **ONE PDF per day** at ~04:00 Cambodia time
- If backup activates, you'll still receive **ONE PDF** (at ~06:00)
- **No duplicates** thanks to idempotency check

### Method 3: Check Workflow Logs

Click on any workflow run → Click job name → Expand steps to see:

```
✅ PRIMARY SUCCESS: Report sent successfully
  Date: 2025-12-15
  Attempt: 1/3
  Schedule: Primary (21:00 UTC)
  Response Time: 2.3s
  Telegram Status: Document sent successfully
```

Or if backup runs:

```
🆘 BACKUP WORKFLOW ACTIVATED
⚠️  Primary workflow may have failed - attempting backup send
✅ BACKUP SUCCESS: Report sent via backup workflow
```

---

## ⚙️ Workflow Features

### Idempotency Protection

Both workflows check `/api/export/status` before sending:

- If today's report already sent → **SKIP** (prevent duplicates)
- If no successful send → **ATTEMPT** send
- Manual override available with `force_retry` input

### Progressive Retry Strategy

**Primary Workflow:**
1. Attempt 1: 5 retries, 3s delay, 60s timeout
2. Wait 30 seconds
3. Attempt 2: 5 retries, 5s delay, 90s timeout  
4. Wait 60 seconds
5. Attempt 3: 10 retries, 10s delay, 120s timeout

**Backup Workflow:**
- Single attempt: 10 retries, 10s delay, 120s timeout
- Only runs if primary failed

### Curl Retry Settings

All curl commands use:
- `--retry-all-errors` (retry on network/HTTP errors)
- `--retry-delay` (progressive: 3s → 5s → 10s)
- `--max-time` (progressive: 60s → 90s → 120s)
- `--connect-timeout` (progressive: 10s → 15s → 20s)

---

## 🚨 Troubleshooting

### Scenario 1: All workflows show green ✅

**Status:** Perfect! Everything working as designed.

**Action:** None needed. Enjoy your daily reports!

---

### Scenario 2: Primary failed ❌, Backup succeeded ✅

**Status:** Primary had issues but backup saved the day.

**Possible Causes:**
- Temporary network issue at 04:00
- Vercel function cold start delay
- Brief Supabase connection issue

**Action:** 
1. Check primary workflow logs to see which step failed
2. If it's recurring, check Vercel logs at https://vercel.com/dashboard
3. Verify environment variables are set correctly

---

### Scenario 3: Both workflows failed ❌❌

**Status:** CRITICAL - Report not sent today.

**Immediate Actions:**

1. **Manual Send via UI:**
   - Go to https://timetable-one-azure.vercel.app/export
   - Click "Send to Telegram"
   - Verify you receive the PDF

2. **Manual Trigger Workflow:**
   - Go to GitHub Actions tab
   - Click "Daily Telegram Export" workflow
   - Click "Run workflow" dropdown
   - Check "Force retry even if already sent"
   - Click green "Run workflow" button

3. **Check Secrets:**
   ```bash
   # Verify these are set in GitHub Settings → Secrets
   CRON_TARGET_URL=https://timetable-one-azure.vercel.app
   CRON_SECRET=<your-secret-key>
   ```

4. **Check Vercel Environment Variables:**
   - Go to Vercel dashboard → Project Settings → Environment Variables
   - Verify `CRON_SECRET` matches GitHub secret
   - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set
   - Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set

---

## 🔧 Manual Testing

### Test Primary Workflow

1. Go to: https://github.com/chensakkolmlbb2025-spec/timetable/actions/workflows/daily-telegram-export.yml
2. Click "Run workflow" dropdown
3. Leave "Force retry" **unchecked** (respects idempotency)
4. Click green "Run workflow" button
5. Wait ~1-2 minutes
6. Check Telegram for PDF

### Test Backup Workflow

1. Go to: https://github.com/chensakkolmlbb2025-spec/timetable/actions/workflows/backup-telegram-export.yml
2. Click "Run workflow" dropdown
3. Click green "Run workflow" button
4. Check logs - should say "Primary succeeded - backup not needed" if you already sent today

### Force Retry (Override Idempotency)

1. Go to primary workflow
2. Click "Run workflow" dropdown  
3. **Check** "Force retry even if already sent today"
4. Click green "Run workflow" button
5. This will send **even if already sent** (useful for testing)

---

## 📅 Schedule Reference

| Time (Cambodia) | Time (UTC) | Workflow | Description |
|-----------------|------------|----------|-------------|
| 04:00 AM | 21:00 | Primary Schedule 1 | First attempt |
| 04:15 AM | 21:15 | Primary Schedule 2 | Backup #1 |
| 04:30 AM | 21:30 | Primary Schedule 3 | Backup #2 |
| 06:00 AM | 23:00 | Backup Workflow | Final safety net |

**Cambodia is UTC+7**

---

## 📈 Success Metrics

### Expected Behavior

- **99.9%+ reliability** (only fail if both primary AND backup fail)
- **One PDF per day** between 04:00-06:30 Cambodia time
- **No duplicates** (idempotency check prevents this)
- **Average send time:** 04:00-04:05 Cambodia (first attempt succeeds)

### What Counts as Success

✅ Green checkmark in GitHub Actions  
✅ PDF received in Telegram  
✅ "success" status in `/api/export/status?date=YYYY-MM-DD`  
✅ Export record created in Supabase `exports` table

### Alert Conditions

🚨 Both workflows failed  
⚠️ Backup workflow activated (primary failed)  
⚠️ Attempt 3 needed (attempts 1-2 failed)

---

## 🛠️ Maintenance

### Weekly Check

Every Sunday, review the past week:

1. Go to GitHub Actions
2. Check workflow run history
3. Count successes vs failures
4. If >1 backup activation per week, investigate

### Monthly Review

Once per month:

1. Review Vercel function logs
2. Check average execution time
3. Review Telegram bot message history
4. Verify no duplicate sends occurred

### Update Checklist

When updating workflow files:

- [ ] Test manually with "Run workflow" first
- [ ] Verify idempotency still works
- [ ] Check no syntax errors in YAML
- [ ] Update this documentation if behavior changes

---

## 🎓 Understanding the System

### Why Triple Primary Schedule?

If 04:00 attempt fails due to temporary network issue:
- 04:15 catches it quickly (only 15 min delay)
- 04:30 provides final chance (still within reasonable morning time)

### Why Backup at 06:00?

- Gives primary 2 hours and 9 attempts to succeed
- Late enough that transient issues likely resolved
- Still early enough to be useful same day
- Checks primary status to avoid duplicate sends

### Why 19 Total Attempts?

**Primary:** 3 schedules × 3 attempts = 9 chances  
**Backup:** 1 schedule × 10 retries = 10 chances  
**Total:** 19 opportunities to send successfully

Probability of all 19 failing simultaneously ≈ 0.01% (if each has 95% success rate)

### Why Idempotency Check?

Prevents scenarios like:
- Primary attempt 1 succeeds but reports failure (network error on response)
- Attempt 2 sends duplicate
- User gets 2+ PDFs

With idempotency:
- Check `/api/export/status` before every send
- If today's date already has "success" status → SKIP
- User always gets exactly ONE PDF per day

---

## 📞 Emergency Contact

If workflows fail for 3+ consecutive days:

1. Check GitHub Issues: https://github.com/chensakkolmlbb2025-spec/timetable/issues
2. Review Vercel logs for errors
3. Verify all environment variables are set
4. Test manual send via UI first
5. Check Supabase connection is healthy
6. Verify Telegram bot token is valid

---

## 🎯 Quick Reference

```bash
# Primary workflow YAML
.github/workflows/daily-telegram-export.yml

# Backup workflow YAML  
.github/workflows/backup-telegram-export.yml

# API endpoint triggered by workflows
/api/cron/daily-report

# Status check endpoint
/api/export/status?date=YYYY-MM-DD

# Manual send endpoint
/api/export/send

# Supabase exports table
exports (id, user_id, date, status, telegram_response, created_at)
```

---

## ✅ Post-Deployment Checklist

- [x] Primary workflow committed and pushed
- [x] Backup workflow committed and pushed  
- [x] GitHub secrets verified (CRON_TARGET_URL, CRON_SECRET)
- [x] Vercel environment variables verified
- [x] Monitoring documentation created
- [ ] **Wait for first automated run (04:00 Cambodia tomorrow)**
- [ ] **Verify PDF received in Telegram**
- [ ] **Check GitHub Actions for green checkmark**
- [ ] **Confirm no duplicate sends**

---

**Last Updated:** December 2025  
**Workflow Version:** Ultimate Edition (Quadruple Redundancy)  
**Reliability Target:** 99.9%+ (zero missed days)
