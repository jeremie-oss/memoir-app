import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAILS = ['jeremiebenhamou@gmail.com', 'jeremie@the-tech-nation.com']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Auth guard: only admin emails allowed
    const serverSb = await createServerSupabase()
    const { data: { user: admin } } = await serverSb.auth.getUser()
    if (!admin || !ADMIN_EMAILS.includes(admin.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password, name } = await req.json()

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'Mot de passe requis (8+ chars)' }, { status: 400 })
    }

    // Create auth user with confirmed email (no verification needed for beta)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || '' },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Auto-create project for the new user
    const userId = data.user.id
    const { error: projErr } = await supabase.from('projects').insert({
      user_id: userId,
      title: name ? `Le livre de ${name}` : 'Mon livre',
      status: 'active',
    })

    if (projErr) {
      console.error('[admin/create-user] project error:', projErr.message)
    }

    return NextResponse.json({ ok: true, userId, email })
  } catch (err) {
    console.error('[admin/create-user]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
