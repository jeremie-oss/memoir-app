export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAILS = ['jeremiebenhamou@gmail.com', 'jeremie@the-tech-nation.com']
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const serverSb = await createServerSupabase()
  const { data: { user: admin } } = await serverSb.auth.getUser()
  if (!admin || !ADMIN_EMAILS.includes(admin.email || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, banned } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requis' }, { status: 400 })

  // banned=true → ban indéfiniment, banned=false → unban
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: banned ? '876600h' : 'none',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}
