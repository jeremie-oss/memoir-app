export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://memoir-app-two.vercel.app'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const serverSb = await createServerSupabase()
    const { data: { user } } = await serverSb.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data: request, error: findError } = await supabase
      .from('access_requests')
      .select('id, email, prenom, nom, status')
      .eq('id', id)
      .single()

    if (findError || !request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (request.status === 'approved') {
      return NextResponse.json({ ok: true, already: true })
    }

    await supabase.from('access_requests').update({ status: 'approved' }).eq('id', id)

    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(request.email, {
      redirectTo: `${SITE_URL}/auth/callback?type=invite`,
      data: {
        name: `${request.prenom}${request.nom ? ' ' + request.nom : ''}`,
        prenom: request.prenom,
      },
    })

    if (inviteError) {
      console.error('[admin approve invite]', inviteError.message)
      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/approve-access]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
