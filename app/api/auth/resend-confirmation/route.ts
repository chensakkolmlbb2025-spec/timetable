import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    const { email, redirectTo } = body || {}
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const supabase = createAdminClient()
    // Use admin.generateLink for a signup verification link (returns action_link and optional email_otp)
    // Cast to any to access the admin namespace which may be available on the auth object
    const adminAny: any = supabase.auth
    const params = { type: 'signup', email, options: { redirectTo: redirectTo || null } }
    const { data, error } = await adminAny.admin.generateLink(params)
    if (error) {
      console.error('Failed to generate signup link', error)
      return NextResponse.json({ error: error.message || String(error) }, { status: 500 })
    }
    // Return the generated action link so the frontend or admin can surface it. In production you should email this.
    return NextResponse.json({ data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
