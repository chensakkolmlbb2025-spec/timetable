import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    // Provide a helpful error message in development to guide setup
    const hint = !url && !anonKey ? 'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are missing' : !url ? 'NEXT_PUBLIC_SUPABASE_URL is missing' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing'
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error(`[supabase] ${hint}. Please copy .env.example to .env.local and add your Supabase project keys.`)
    }
    throw new Error(`Supabase client misconfigured: ${hint}`)
  }

  return createBrowserClient(url, anonKey)
}
