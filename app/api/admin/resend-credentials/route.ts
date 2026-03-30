export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(req: NextRequest) {
  const serverSb = await createServerSupabase()
  const { data: { user: admin } } = await serverSb.auth.getUser()
  if (!admin || !ADMIN_EMAILS.includes(admin.email || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, email, name } = await req.json()
  if (!userId || !email) return NextResponse.json({ error: 'userId et email requis' }, { status: 400 })

  // Génère un nouveau mot de passe
  const newPassword = `Memoir${Math.random().toString(36).slice(2, 6)}!${Math.floor(Math.random() * 90 + 10)}`

  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await resend?.emails.send({
    from: 'M.emoir <noreply@the-tech-nation.com>',
    to: email,
    subject: 'Vos identifiants M.emoir',
    html: `
      <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #1C1C2E;">
        <h2 style="color: #C4622A;">Vos identifiants M.emoir${name ? `, ${name}` : ''}</h2>
        <p><strong>Email :</strong> ${email}<br/>
        <strong>Mot de passe :</strong> ${newPassword}</p>
        <p>
          <a href="https://memoir-8v2714i9j-jeremie-3244s-projects.vercel.app/login"
             style="background:#C4622A;color:#FAF8F4;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
            Accéder à M.emoir
          </a>
        </p>
        <p style="color:#7A4F32;font-size:13px;">Vous pouvez changer votre mot de passe depuis les paramètres.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
