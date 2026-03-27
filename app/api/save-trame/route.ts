import { NextRequest, NextResponse } from 'next/server'
import { supabaseService, ensureAuthUser, ensureProject } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, chapters } = await req.json()

    if (!userId || !chapters?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const authUserId = await ensureAuthUser(userId, userName)
    const project = await ensureProject(authUserId, userName)

    // Upsert: check if trame exists for this project
    const { data: existing } = await supabaseService
      .from('trame')
      .select('id, version')
      .eq('project_id', project.id)
      .single()

    if (existing) {
      await supabaseService
        .from('trame')
        .update({ content: chapters, version: existing.version + 1 })
        .eq('id', existing.id)
    } else {
      await supabaseService
        .from('trame')
        .insert({
          project_id: project.id,
          user_id: authUserId,
          content: chapters,
          version: 1,
        })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[save-trame]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
