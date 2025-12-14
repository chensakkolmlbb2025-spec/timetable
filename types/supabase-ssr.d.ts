declare module '@supabase/ssr' {
  import type { SupabaseClient } from '@supabase/supabase-js'
  export function createBrowserClient(...args: any[]): SupabaseClient<any, 'public', any>
  export function createServerClient(...args: any[]): SupabaseClient<any, 'public', any>
}
