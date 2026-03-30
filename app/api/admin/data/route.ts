export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Auth guard: only admin emails allowed
    const serverSb = await createServerSupabase()
    const { data: { user } } = await serverSb.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Fetch all auth users
    const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 200 })
    const users = (authData?.users || [])
      .filter((u) => !u.email?.endsWith('@memoir-beta.app')) // exclude auto-created placeholder users
      .map((u) => ({
        id: u.id,
        email: u.email || '',
        name: u.user_metadata?.name || '',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }))

    // Fetch waitlist
    const { data: waitlist } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false })

    // Fetch all projects
    const { data: projects } = await supabase
      .from('projects')
      .select('user_id, title, word_count, passage_count, status')

    // Fetch all streaks
    const { data: streaks } = await supabase
      .from('streaks')
      .select('user_id, current_streak, longest_streak, total_days, last_written_at')

    // Fetch access requests
    const { data: accessRequests } = await supabase
      .from('access_requests')
      .select('id, email, prenom, nom, motivation, status, created_at')
      .order('created_at', { ascending: false })

    // Fetch feedbacks
    const { data: feedbacks } = await supabase
      .from('feedbacks')
      .select('id, user_email, page_url, page_context, message, rating, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    return NextResponse.json({
      users,
      waitlist: waitlist || [],
      projects: projects || [],
      streaks: streaks || [],
      accessRequests: accessRequests || [],
      feedbacks: feedbacks || [],
    })
  } catch (err) {
    console.error('[admin/data]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
