import { NextRequest, NextResponse } from 'next/server'
import { supabaseService as supabase, ensureAuthUser, ensureProject } from '@/lib/supabase/service'

type SavePayload = {
  userId: string       // local UUID — may not exist in auth.users yet
  userName: string
  chapterId: string
  chapterTitle?: string
  content: string
  wordCount: number
  mode: string         // 'libre' | 'guide' | 'dicte' | 'entretien'
  notes?: string
  durationSec?: number
}

// Map app mode names to DB enum values
const MODE_MAP: Record<string, string> = {
  libre: 'free',
  guide: 'guided',
  dicte: 'dictated',
  entretien: 'assisted',
}

export async function POST(req: NextRequest) {
  try {
    const body: SavePayload = await req.json()
    const { userId: localUserId, userName, chapterId, chapterTitle, content, wordCount, mode, notes, durationSec } = body

    if (!localUserId || !content) {
      return NextResponse.json({ error: 'Missing userId or content' }, { status: 400 })
    }

    const authUserId = await ensureAuthUser(localUserId, userName)
    const project = await ensureProject(authUserId, userName)
    const projectId = project.id

    // 2. Insert passage (the written text)
    const dbMode = MODE_MAP[mode] || 'free'
    const { data: passage, error: passErr } = await supabase
      .from('passages')
      .insert({
        project_id: projectId,
        user_id: authUserId,
        title: chapterTitle || chapterId,
        content,
        word_count: wordCount,
        chapter_ref: chapterId,
        mode: dbMode,
        status: 'draft',
      })
      .select('id')
      .single()

    if (passErr) {
      console.error('[save-session] passage insert error:', passErr.message)
      return NextResponse.json({ error: 'Failed to save passage', detail: passErr.message }, { status: 500 })
    }

    // 3. Insert session log
    const { error: sessErr } = await supabase
      .from('sessions')
      .insert({
        project_id: projectId,
        user_id: authUserId,
        passage_id: passage!.id,
        words_written: wordCount,
        duration_sec: durationSec || 0,
        mode: dbMode,
        ended_at: new Date().toISOString(),
      })

    if (sessErr) {
      console.error('[save-session] session insert error:', sessErr.message)
    }

    // 4. Update streak
    const today = new Date().toISOString().split('T')[0]
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', authUserId)
      .eq('project_id', projectId)
      .single()

    if (streak) {
      const lastDate = streak.last_written_at
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yStr = yesterday.toISOString().split('T')[0]

      let newCurrent = streak.current_streak
      if (lastDate === today) {
        // already wrote today
      } else if (lastDate === yStr) {
        newCurrent = streak.current_streak + 1
      } else {
        newCurrent = 1
      }

      await supabase
        .from('streaks')
        .update({
          current_streak: newCurrent,
          longest_streak: Math.max(streak.longest_streak, newCurrent),
          last_written_at: today,
          total_days: lastDate === today ? streak.total_days : streak.total_days + 1,
        })
        .eq('id', streak.id)
    } else {
      await supabase
        .from('streaks')
        .insert({
          user_id: authUserId,
          project_id: projectId,
          current_streak: 1,
          longest_streak: 1,
          last_written_at: today,
          total_days: 1,
        })
    }

    // 5. Update project word count
    await supabase
      .from('projects')
      .update({
        word_count: (project.word_count || 0) + wordCount,
        passage_count: (project.passage_count || 0) + 1,
      })
      .eq('id', projectId)

    return NextResponse.json({
      ok: true,
      passageId: passage!.id,
      projectId,
      authUserId, // return so client can update its store if different from localId
    })
  } catch (err) {
    console.error('[save-session]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
