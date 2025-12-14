#!/usr/bin/env node
// Full seed script: create an auth user via the admin API and insert matching profile + preferences
// Usage:
// SUPABASE_URL=https://<project>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service-role-key> node scripts/seed.js

const { createClient } = require('@supabase/supabase-js')

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
    process.exit(1)
  }

  const supabase = createClient(url, key)

  const email = 'chensakkol1124@gmail.com'
  const password = 'Chensakkol2004'
  const id = 'b3d9f5c4-2a1e-4f7b-9c8d-1234567890ab'
  const name = 'Chen Sakkol'

  try {
    const adminAny = supabase.auth
    const { data: createData, error: createError } = await adminAny.admin.createUser({
      email,
      password,
      id,
      user_metadata: { name },
    })
    if (createError) {
      // If user already exists, warn and continue
      console.warn('createUser returned error (may already exist):', createError.message || createError)
    } else {
      console.log('Auth user created:', createData)
    }

    // Upsert profile and preferences using admin client
    const { data: profileData, error: profileError } = await supabase.from('profiles').upsert({ id, email, name }).select()
    if (profileError) {
      console.error('Failed to upsert profile:', profileError)
      process.exit(1)
    }
    console.log('Profile upserted')

    const prefs = {
      user_id: id,
      theme: 'auto',
      week_start_day: 1,
      default_day_start: '06:00',
      default_day_end: '22:00',
      notifications: true,
    }
    const { data: prefsData, error: prefsError } = await supabase.from('preferences').upsert(prefs).select()
    if (prefsError) {
      console.error('Failed to upsert preferences:', prefsError)
      process.exit(1)
    }
    console.log('Preferences upserted')

    console.log('\nSeed complete. You can now sign in with:')
    console.log(`  email: ${email}`)
    console.log(`  password: ${password}`)
  } catch (err) {
    console.error('Unexpected error during seed:', err)
    process.exit(1)
  }
}

main()
