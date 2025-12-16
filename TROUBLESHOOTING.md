# 🔧 Daily Export Not Working - Troubleshooting Guide

## Quick Diagnostic Checklist

Run through these steps in order to identify the issue:

### 1. ✅ Check GitHub Actions are Running

```bash
gh run list --workflow="daily-telegram-export.yml" --limit 3
```

**Expected:** Recent runs with ✓ (success) status  
**If failing:** Check GitHub Actions tab for error messages

---

### 2. ✅ Verify Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables

**Required variables:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `TELEGRAM_BOT_TOKEN`
- ✅ `TELEGRAM_CHAT_ID`
- ✅ `CRON_SECRET`
- ✅ `EXPORT_DEFAULT_USER_ID`

**How to get EXPORT_DEFAULT_USER_ID:**
1. Sign in to your app
2. Go to Settings page
3. Open browser console (F12)
4. Type: `localStorage.getItem('sb-your-project-auth-token')` and look for the user ID

**Alternative:** Query Supabase directly:
```sql
SELECT id, email, name FROM auth.users LIMIT 10;
```

---

### 3. ✅ Test the Cron Endpoint Manually

Create a file `test-cron.sh`:

```bash
#!/bin/bash

# Replace these with your actual values
CRON_SECRET="your-cron-secret-from-vercel"
TARGET_URL="https://your-app.vercel.app"

echo "Testing cron endpoint..."
curl -v -X POST "$TARGET_URL/api/cron/daily-report" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json"
```

Run it:
```bash
chmod +x test-cron.sh
./test-cron.sh
```

**Expected response:**
```json
{"success":true,"message":"..."}
```

**Common errors:**
- `401 Unauthorized` → CRON_SECRET mismatch
- `400 Bad Request` → Missing EXPORT_DEFAULT_USER_ID
- `500 Internal Server Error` → Check Vercel logs

---

### 4. ✅ Verify GitHub Secrets

```bash
gh secret list
```

**Required secrets:**
- ✅ `CRON_SECRET` (must match Vercel's CRON_SECRET)
- ✅ `CRON_TARGET_URL` (your Vercel deployment URL)

**Set secrets if missing:**
```bash
gh secret set CRON_SECRET
# Paste your cron secret

gh secret set CRON_TARGET_URL
# Paste: https://your-app.vercel.app
```

---

### 5. ✅ Check Telegram Bot Configuration

**Test bot token:**
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
```

**Expected:** JSON with bot info  
**If error:** Token is invalid, get new one from @BotFather

**Test sending to chat:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
  -d "chat_id=<YOUR_CHAT_ID>" \
  -d "text=Test message"
```

**Expected:** Message appears in your Telegram  
**If error:** Chat ID is wrong or bot not added to chat

---

### 6. ✅ Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by `/api/cron/daily-report`
5. Look for errors around 04:00-04:30 Cambodia time (21:00-21:30 UTC)

**Common log errors:**
- "Missing EXPORT_DEFAULT_USER_ID" → Add env var in Vercel
- "Missing Telegram configuration" → Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
- "Invalid cron secret" → Mismatch between GitHub and Vercel CRON_SECRET
- "No data for date" → No time blocks created for that day

---

### 7. ✅ Test with Manual Workflow Trigger

```bash
gh workflow run daily-telegram-export.yml
```

Check the run:
```bash
gh run list --workflow="daily-telegram-export.yml" --limit 1
```

View logs:
```bash
gh run view <RUN_ID> --log
```

---

### 8. ✅ Check Database for Time Blocks

In your Supabase SQL Editor:

```sql
-- Check if you have any time blocks
SELECT 
  date,
  COUNT(*) as block_count
FROM time_blocks
WHERE user_id = '<YOUR_USER_ID>'
  AND date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;
```

**If no blocks:** The cron will return "No data for date" (which is success:true)

---

## 🚨 Most Common Issues

### Issue 1: EXPORT_DEFAULT_USER_ID not set
**Symptom:** Endpoint returns 400 Bad Request  
**Solution:** Add EXPORT_DEFAULT_USER_ID to Vercel environment variables

### Issue 2: CRON_SECRET mismatch
**Symptom:** Endpoint returns 401 Unauthorized  
**Solution:** Ensure GitHub secret CRON_SECRET matches Vercel env var

### Issue 3: No time blocks for today
**Symptom:** Workflow succeeds but no PDF sent  
**Solution:** Create time blocks in the app first

### Issue 4: Telegram bot not configured
**Symptom:** Error "Missing Telegram configuration"  
**Solution:** Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to Vercel

### Issue 5: Bot can't send to chat
**Symptom:** Telegram API error  
**Solution:** 
- If private chat: Start conversation with bot first (send /start)
- If group: Add bot to group with admin permissions
- If channel: Add bot as administrator

---

## 🔍 Advanced Debugging

### Enable Debug Mode

Add this to Vercel env vars:
```
DEBUG=telegram:*
```

### View Export Log

```sql
SELECT * 
FROM exports_log 
WHERE user_id = '<YOUR_USER_ID>'
ORDER BY created_at DESC
LIMIT 10;
```

### Manual Test via API

Use the debug endpoint (if enabled):
```bash
curl -X POST "https://your-app.vercel.app/api/debug/send-as" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<YOUR_USER_ID>","date":"2025-12-16"}'
```

---

## ✅ Success Confirmation

When working properly, you should see:

1. **GitHub Actions:** ✅ Success every day at 04:00 Cambodia time
2. **Telegram:** Daily PDF arrives at 04:00-04:30 Cambodia time
3. **Vercel Logs:** "Report sent successfully" around 21:00-21:30 UTC
4. **Database:** New row in `exports_log` with status='success'

---

## 📞 Still Not Working?

1. Run ALL checklist items above
2. Collect error messages from:
   - GitHub Actions logs
   - Vercel function logs
   - Telegram bot API test results
3. Check that your timezone is correct (Cambodia = UTC+7)
4. Verify you have data in your timetable for the target date

---

## Quick Fix Script

Create `diagnose.sh`:

```bash
#!/bin/bash
echo "=== Absolute Timetable Diagnostic ==="
echo ""
echo "1. Checking GitHub workflows..."
gh run list --workflow="daily-telegram-export.yml" --limit 3
echo ""
echo "2. Checking GitHub secrets..."
gh secret list
echo ""
echo "3. Test bot token..."
read -p "Enter TELEGRAM_BOT_TOKEN: " BOT_TOKEN
curl -s "https://api.telegram.org/bot$BOT_TOKEN/getMe" | jq .
echo ""
echo "4. Current Cambodia time (UTC+7):"
TZ='Asia/Phnom_Penh' date
echo ""
echo "Diagnostic complete. Review results above."
```

Run:
```bash
chmod +x diagnose.sh
./diagnose.sh
```
