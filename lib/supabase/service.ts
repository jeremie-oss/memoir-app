import { createClient } from '@supabase/supabase-js'

// Service-role client bypasses RLS — server-side only
// Lazy singleton to avoid module-level crash at build time when env vars are absent
let _supabaseService: ReturnType<typeof createClient> | null = null
export function getSupabaseService() {
  if (!_supabaseService) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
    _supabaseService = createClient(url, key)
  }
  return _supabaseService
}
/** @deprecated use getSupabaseService() */
export const supabaseService = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    return (getSupabaseService() as any)[prop]
  },
})

/**
 * Ensure a Supabase auth user exists for this local userId.
 * Uses getUserById (O(1)) first, then falls back to create.
 */
export async function ensureAuthUser(localId: string, userName: string): Promise<string> {
  // Fast path: local UUID is already a valid Supabase auth user
  const { data: byId } = await supabaseService.auth.admin.getUserById(localId)
  if (byId?.user) return byId.user.id

  // Create a placeholder auth user keyed by the local UUID
  const email = `beta-${localId.slice(0, 8)}@memoir-beta.app`
  const { data: created, error } = await supabaseService.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { local_id: localId, name: userName },
  })

  if (error) {
    if (error.message?.includes('already been registered')) {
      // Race condition: user was just created — fetch by email
      const { data: list } = await supabaseService.auth.admin.listUsers({ perPage: 1000 })
      const found = list?.users?.find((u) => u.email === email)
      if (found) return found.id
    }
    throw new Error(`Failed to create auth user: ${error.message}`)
  }

  return created.user.id
}

/**
 * Ensure an active project exists for the user, create one if needed.
 * Returns { id, word_count, passage_count }.
 */
export async function ensureProject(authUserId: string, userName: string) {
  let { data: project } = await supabaseService
    .from('projects')
    .select('id, word_count, passage_count')
    .eq('user_id', authUserId)
    .eq('status', 'active')
    .single()

  if (!project) {
    const { data: newProject, error } = await supabaseService
      .from('projects')
      .insert({
        user_id: authUserId,
        title: userName ? `Le livre de ${userName}` : 'Mon livre',
        status: 'active',
      })
      .select('id, word_count, passage_count')
      .single()

    if (error) throw new Error(`Failed to create project: ${error.message}`)
    project = newProject
  }

  return project!
}
