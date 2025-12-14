import { NextResponse } from 'next/server'
import { getTelegramConfig } from '@/lib/telegram/config'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const filePath = url.searchParams.get('file_path')
    const secret = url.searchParams.get('secret')
    const adminSecret = process.env.ADMIN_UI_SECRET
    if (adminSecret && secret !== adminSecret) return NextResponse.json({ ok: false, message: 'Invalid secret' }, { status: 401 })
    if (!filePath) return NextResponse.json({ ok: false, message: 'Missing file_path' }, { status: 400 })

    const { botToken } = getTelegramConfig()
    if (!botToken) return NextResponse.json({ ok: false, message: 'Missing bot token' }, { status: 500 })

    const fetchUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`
    const res = await fetch(fetchUrl)
    if (!res.ok) return NextResponse.json({ ok: false, message: 'Failed to fetch file', status: res.status }, { status: 502 })
    const buffer = await res.arrayBuffer()
    return new NextResponse(Buffer.from(buffer), { headers: { 'Content-Type': 'application/pdf' } })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ ok: false, message: String(e) }, { status: 500 })
  }
}

export {}
