import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const maskedAnon = anonKey ? `${anonKey.slice(0, 6)}...${anonKey.slice(-4)}` : null
  const maskedService = serviceKey ? `${serviceKey.slice(0, 6)}...${serviceKey.slice(-4)}` : null

  const result: any = { anon: maskedAnon, hasServiceRole: !!serviceKey }
  try {
    const supabase = createAdminClient()
    // Try a lightweight admin operation: list users/ or select a single profile
    // use profiles select as a basic connectivity test
    const { data, error } = await supabase.from('profiles').select('id').limit(1)
    if (error) {
      result.adminCheck = { ok: false, error: error.message }
    } else {
      result.adminCheck = { ok: true, count: (data || []).length }
    }
  } catch (err: any) {
    result.adminCheck = { ok: false, error: String(err?.message || err) }
  }

  return NextResponse.json(result)
}
