import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ADMIN_EMAIL = 'jeremiebenhamou@gmail.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://getyourmemoir.com'

export async function POST(req: NextRequest) {
  try {
    const { email, prenom, nom, motivation } = await req.json()

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }
    if (!prenom?.trim()) {
      return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })
    }

    const { data: inserted, error } = await supabase
      .from('access_requests')
      .upsert(
        {
          email: email.trim().toLowerCase(),
          prenom: prenom.trim(),
          nom: nom?.trim() || null,
          motivation: motivation?.trim() || null,
          status: 'pending',
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('token')
      .single()

    if (error) {
      console.error('[access-request insert]', error.message)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    // Notify admin by email (non-blocking)
    if (process.env.RESEND_API_KEY && inserted?.token) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const approveUrl = `${SITE_URL}/api/access-request/approve?token=${inserted.token}`

        await resend.emails.send({
          from: 'Memoir Notifications <bonjour@getyourmemoir.com>',
          to: ADMIN_EMAIL,
          subject: `[Memoir Beta] Nouvelle demande — ${prenom}${nom ? ' ' + nom : ''}`,
          html: `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir — Accès anticipé</p>
  <h1 style="font-size:24px;font-weight:400;font-style:italic;margin-bottom:24px;">Nouvelle demande d'accès beta</h1>
  <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
    <tr><td style="padding:8px 0;color:#7A4F32;font-size:14px;width:110px;">Prénom</td><td style="padding:8px 0;font-size:14px;font-weight:600;">${prenom}</td></tr>
    <tr><td style="padding:8px 0;color:#7A4F32;font-size:14px;">Nom</td><td style="padding:8px 0;font-size:14px;">${nom || '—'}</td></tr>
    <tr><td style="padding:8px 0;color:#7A4F32;font-size:14px;">Email</td><td style="padding:8px 0;font-size:14px;">${email}</td></tr>
    <tr><td style="padding:8px 0;color:#7A4F32;font-size:14px;vertical-align:top;">Motivation</td><td style="padding:8px 0;font-size:14px;line-height:1.7;font-style:italic;">${motivation || '(non renseignée)'}</td></tr>
  </table>
  <a href="${approveUrl}" style="display:inline-block;padding:14px 32px;background:#C4622A;color:white;text-decoration:none;border-radius:100px;font-size:15px;font-family:sans-serif;font-weight:500;">
    ✦ Approuver l'accès
  </a>
  <p style="font-size:12px;color:#9C8E80;margin-top:32px;border-top:1px solid #EDE4D8;padding-top:20px;">
    Ou gérez cette demande dans le <a href="${SITE_URL}/admin" style="color:#C4622A;text-decoration:none;">backoffice admin</a>.
  </p>
</div>`,
        })
      } catch (emailErr) {
        console.error('[access-request email]', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[access-request]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
