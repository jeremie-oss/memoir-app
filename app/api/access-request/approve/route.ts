import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://memoir-app-two.vercel.app'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/admin?error=missing_token`)
  }

  try {
    const { data: request, error: findError } = await supabase
      .from('access_requests')
      .select('id, email, prenom, nom, status')
      .eq('token', token)
      .single()

    if (findError || !request) {
      return NextResponse.redirect(`${SITE_URL}/admin?error=invalid_token`)
    }

    if (request.status === 'approved') {
      return NextResponse.redirect(
        `${SITE_URL}/admin?info=already_approved&email=${encodeURIComponent(request.email)}`
      )
    }

    // Mark as approved
    await supabase
      .from('access_requests')
      .update({ status: 'approved' })
      .eq('id', request.id)

    // Send Supabase invite — user receives a magic link to set their password
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(request.email, {
      redirectTo: `${SITE_URL}/auth/callback?type=invite`,
      data: {
        name: `${request.prenom}${request.nom ? ' ' + request.nom : ''}`,
        prenom: request.prenom,
      },
    })

    if (inviteError) {
      console.error('[approve invite]', inviteError.message)
      return NextResponse.redirect(
        `${SITE_URL}/admin?error=invite_failed&email=${encodeURIComponent(request.email)}`
      )
    }

    return NextResponse.redirect(
      `${SITE_URL}/admin?success=approved&email=${encodeURIComponent(request.email)}`
    )
  } catch (err) {
    console.error('[access-request approve]', err)
    return NextResponse.redirect(`${SITE_URL}/admin?error=server_error`)
  }
}
