import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Singleton pattern for admin client
let adminClient: SupabaseClient | null = null

/**
 * Creates a Supabase admin client with service role key
 * This client bypasses Row Level Security (RLS)
 * 
 * ⚠️ WARNING: Only use this on the server side!
 * Never expose the service role key to the client.
 */
export function createAdminClient(): SupabaseClient {
  // Return existing client if already created
  if (adminClient) {
    return adminClient
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey) {
    const missing = []
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    throw new Error(`[supabase-admin] Missing environment variables: ${missing.join(', ')}`)
  }

  // Ensure this is only used server-side
  if (typeof window !== 'undefined') {
    throw new Error('[supabase-admin] Admin client cannot be used in the browser!')
  }

  adminClient = createClient(url, serviceRoleKey, {
    auth: {
      // Disable auto-refresh for admin client
      autoRefreshToken: false,
      // Don't persist session for admin client
      persistSession: false,
    },
    global: {
      headers: {
        'x-client-info': 'absolute-timetable-admin',
      },
    },
  })
  
  return adminClient
}

/**
 * Get a user by ID using admin privileges
 */
export async function getAdminUser(userId: string) {
  const client = createAdminClient()
  const { data, error } = await client.auth.admin.getUserById(userId)
  
  if (error) {
    console.error('[supabase-admin] Failed to get user:', error.message)
    return null
  }
  
  return data.user
}

/**
 * Delete a user by ID using admin privileges
 */
export async function deleteAdminUser(userId: string) {
  const client = createAdminClient()
  const { error } = await client.auth.admin.deleteUser(userId)
  
  if (error) {
    console.error('[supabase-admin] Failed to delete user:', error.message)
    return { success: false, error: error.message }
  }
  
  return { success: true, error: null }
}

/**
 * List all users using admin privileges
 */
export async function listAdminUsers(page = 1, perPage = 50) {
  const client = createAdminClient()
  const { data, error } = await client.auth.admin.listUsers({
    page,
    perPage,
  })
  
  if (error) {
    console.error('[supabase-admin] Failed to list users:', error.message)
    return { users: [], error: error.message }
  }
  
  return { users: data.users, error: null }
}

export default createAdminClient
