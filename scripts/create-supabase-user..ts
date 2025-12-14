#!/usr/bin/env node
// Create a Supabase auth user using the service-role key.
// Usage (fill your env vars):
// SUPABASE_URL=https://xyz.supabase.co SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/create-supabase-user.js

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
  // You may change this id if you prefer; keep it consistent with the SQL seed below.
  const id = 'b3d9f5c4-2a1e-4f7b-9c8d-1234567890ab'

  try {
    // The admin namespace is available on the auth client in the server-side library
    const adminAny = supabase.auth
    const { data, error } = await adminAny.admin.createUser({
      email,
      password,
      id,
      user_metadata: { name: 'Chen Sakkol' },
    })

    if (error) {
      console.error('Failed to create user:', error)
      process.exit(1)
    }

    console.log('User created successfully:')
    console.log(JSON.stringify(data, null, 2))
    console.log('\nNext steps:')
    console.log('- Run `psql` or the SQL script `db/seed-user.sql` to insert corresponding profile/preferences if needed.')
    console.log('- The user should receive a confirmation email if your project requires email verification.')
  } catch (err) {
    console.error('Unexpected error creating user:', err)
    process.exit(1)
  }
}

main()
