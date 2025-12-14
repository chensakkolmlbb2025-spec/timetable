#!/usr/bin/env node
/* Insert a single test time_block for EXPORT_DEFAULT_USER_ID on a given date (defaults to today in UTC+7) */
const { createClient } = require('@supabase/supabase-js')
// .env.local is sourced before running this script (so env vars are available)

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const userId = process.env.EXPORT_DEFAULT_USER_ID
  if (!url || !key || !userId) {
    console.error('Missing env vars. Make sure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and EXPORT_DEFAULT_USER_ID are set in .env.local')
    process.exit(1)
  }
  const supabase = createClient(url, key)

  // Ensure a profile exists for the userId (since time_blocks.user_id references profiles.id)
  await supabase.from('profiles').upsert({ id: userId, email: 'auto@timetable.local', name: 'Auto Test User' })

  // date in UTC+7
  const now = new Date()
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  const yyyy = shifted.getUTCFullYear()
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(shifted.getUTCDate()).padStart(2, '0')
  const date = `${yyyy}-${mm}-${dd}`

  const block = {
    id: require('crypto').randomUUID(),
    user_id: userId,
    title: 'Test Block',
    description: 'Automatically inserted test block',
    date,
    start_time: '09:00',
    end_time: '10:00',
    category: 'work',
    color: '#3b82f6',
    completed: false,
    repeat_daily: false,
  }

  const { data, error } = await supabase.from('time_blocks').insert(block).select()
  if (error) {
    console.error('Insert failed:', error)
    process.exit(1)
  }
  console.log('Inserted block:', data)
}

main().catch((e) => { console.error(e); process.exit(1) })
