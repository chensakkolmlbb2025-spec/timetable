import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id } = body || {}
    if (!user_id) return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })

    // Security guard: ensure token belongs to the requested user_id
    const token = request.headers.get('x-supabase-access-token')
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

    const anon = createBrowserClient()
    const { data: userData, error: userError } = await anon.auth.getUser(token)
    if (userError || !userData?.user) {
      console.error('Invalid token when verifying user (preferences upsert)', userError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    if (userData.user.id !== user_id) return NextResponse.json({ error: 'Mismatched user id' }, { status: 403 })

    const supabase = createAdminClient()
    const { data, error } = await supabase.from('preferences').upsert(body).select()
    if (error) {
      console.error('Admin upsert error for preferences', { user_id, error })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
