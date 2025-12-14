import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({} as any))
  const { email, password, name } = body || {}
  if (!email || !password) return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })

  try {
    const supabase = createAdminClient()
    // Use admin API to create user
    // The admin API client exposes auth.admin.* methods; try to call createUser
    // cast to any for flexibility
    const adminAny: any = supabase.auth
    const { data, error } = await adminAny.admin.createUser({ email, password, user_metadata: { name } })
    if (error) {
      return NextResponse.json({ ok: false, error: (error as any).message || String(error) }, { status: 500 })
    }
    return NextResponse.json({ ok: true, data })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
