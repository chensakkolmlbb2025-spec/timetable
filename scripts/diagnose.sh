#!/bin/bash

# Quick diagnostic for daily export issues
echo "========================================="
echo "📊 Daily Export Diagnostic Tool"
echo "========================================="
echo ""

# Check GitHub workflows
echo "1️⃣ Checking recent workflow runs..."
echo "---"
gh run list --workflow="daily-telegram-export.yml" --limit 5 2>/dev/null || echo "❌ GitHub CLI not installed or not authenticated"
echo ""

# Check GitHub secrets
echo "2️⃣ Checking GitHub secrets..."
echo "---"
gh secret list 2>/dev/null || echo "❌ Cannot access secrets"
echo ""

# Get current time in Cambodia
echo "3️⃣ Current time:"
echo "---"
echo "UTC:      $(date -u '+%Y-%m-%d %H:%M:%S %Z')"
echo "Cambodia: $(TZ='Asia/Phnom_Penh' date '+%Y-%m-%d %H:%M:%S %Z')"
echo "Next scheduled run: 04:00 Cambodia time (21:00 UTC)"
echo ""

# Check if .env.local exists
echo "4️⃣ Checking local environment..."
echo "---"
if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    echo "Checking required variables..."
    
    check_env() {
        if grep -q "^$1=" .env.local; then
            echo "  ✅ $1 is set"
        else
            echo "  ❌ $1 is MISSING"
        fi
    }
    
    check_env "NEXT_PUBLIC_SUPABASE_URL"
    check_env "TELEGRAM_BOT_TOKEN"
    check_env "TELEGRAM_CHAT_ID"
    check_env "CRON_SECRET"
    check_env "EXPORT_DEFAULT_USER_ID"
else
    echo "❌ .env.local not found (this is OK if using Vercel env vars)"
fi
echo ""

# Instructions
echo "5️⃣ Next steps:"
echo "---"
echo "If GitHub Actions show ✅ success but you're not receiving PDFs:"
echo ""
echo "a) Check Vercel environment variables:"
echo "   → https://vercel.com/your-username/your-project/settings/environment-variables"
echo ""
echo "b) Required Vercel env vars:"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - TELEGRAM_CHAT_ID"
echo "   - EXPORT_DEFAULT_USER_ID"
echo "   - CRON_SECRET (must match GitHub secret)"
echo ""
echo "c) Test manually:"
echo "   gh workflow run daily-telegram-export.yml"
echo ""
echo "d) View detailed logs:"
echo "   gh run list --workflow=daily-telegram-export.yml --limit 1"
echo "   gh run view <RUN_ID> --log"
echo ""
echo "📖 See TROUBLESHOOTING.md for complete guide"
echo "========================================="
