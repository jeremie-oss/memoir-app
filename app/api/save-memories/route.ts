import { NextRequest, NextResponse } from 'next/server'
import { supabaseService, ensureAuthUser, ensureProject } from '@/lib/supabase/service'

type Seed = {
  content: string
  tags: string[]
  theme: string
}

export async function POST(req: NextRequest) {
  try {
    const { userId, userName, seeds } = await req.json() as {
      userId: string
      userName: string
      seeds: Seed[]
    }

    if (!userId || !seeds?.length) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 })
    }

    const authUserId = await ensureAuthUser(userId, userName)
    const project = await ensureProject(authUserId, userName)

    const rows = seeds.map((s) => ({
      project_id: project.id,
      user_id: authUserId,
      content: s.content,
      tags: s.tags,
      used: false,
    }))

    const { error } = await supabaseService.from('memories').insert(rows)
    if (error) {
      console.error('[save-memories]', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: seeds.length })
  } catch (err) {
    console.error('[save-memories]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
