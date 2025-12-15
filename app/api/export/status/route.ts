import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const date = url.searchParams.get("date")
    if (!date) return NextResponse.json({ success: false, message: "missing date" }, { status: 400 })

    const supabase = await createServerClient()
    
    // Try both getSession and getUser for better reliability
    let userId: string | null = null
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData?.session?.user?.id) {
      userId = sessionData.session.user.id
    } else {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user?.id) {
        userId = userData.user.id
      }
    }
    
  // If not authenticated, return an OK response with an empty record so the
  // client can handle this case without producing a noisy 401 in the browser
  // network panel. The UI still treats a null record as "no status".
  if (!userId) return NextResponse.json({ success: true, record: null })

    try {
      const admin = (await import("@/lib/supabase/admin")).createAdminClient()
      const { data, error } = await admin.from("exports").select("*").eq("user_id", userId).eq("report_date", date).single()
      if (error) {
        console.error("exports table query error:", error)
        // If the exports table doesn't exist or another DB error occurs, return empty result rather than 500
        return NextResponse.json({ success: true, record: null })
      }
      return NextResponse.json({ success: true, record: data })
    } catch (e) {
      console.error("Failed to query exports table:", e)
      // Return empty result so the UI can continue to work even if logging isn't available
      return NextResponse.json({ success: true, record: null })
    }
  } catch (e) {
    console.error(e)
    const err = e instanceof Error ? { message: e.message, stack: e.stack } : { message: String(e) }
    // In dev, return error details; in prod, still return a 500 but include a short message
    return NextResponse.json({ success: false, error: err }, { status: 500 })
  }
}
