import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

// Server-side Supabase client — uses service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_ORIGINS = [
  'https://memoir.app',
  'https://www.memoir.app',
  'https://getyourmemoir.com',
  'http://localhost:3000',
]

function getCorsHeaders(req?: NextRequest): Record<string, string> {
  const origin = req?.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ADMIN_EMAILS = ['jeremiebenhamou@gmail.com', 'jeremie@the-tech-nation.com']

function generateApproveToken(email: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32)
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req)
  try {
    const { email, name, prenom, ville, source, lang, snippet, pour_qui, quoi_ecrire } = await req.json()

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400, headers: cors })
    }

    const { error } = await supabase.from('waitlist').upsert(
      {
        email: email.trim().toLowerCase(),
        name: name || null,
        prenom: prenom || null,
        ville: ville || null,
        source: source || 'unknown',
        lang: lang || 'fr',
        pour_qui: pour_qui || null,
        quoi_ecrire: quoi_ecrire ? quoi_ecrire.slice(0, 500) : null,
        session_snippet: snippet ? snippet.slice(0, 200) : null,
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )

    if (error) {
      console.error('[waitlist insert]', error.message)
      return NextResponse.json({ error: 'Database error' }, { status: 500, headers: cors })
    }

    // Send welcome email if Resend is configured
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      try {
        const firstName = (name || 'vous').split(' ')[0]
        const isEn = lang === 'en'
        const isEs = lang === 'es'

        await resend.emails.send({
          from: 'Jérémie · Memoir <bonjour@getyourmemoir.com>',
          to: email.trim().toLowerCase(),
          subject: isEn
            ? `${firstName}, your early access is reserved ✦`
            : isEs
            ? `${firstName}, tu acceso anticipado está reservado ✦`
            : `${firstName}, votre accès anticipé est réservé ✦`,
          html: isEn ? `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir</p>
  <h1 style="font-size:28px;font-weight:400;font-style:italic;margin-bottom:16px;line-height:1.3;">Your story is on its way.</h1>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:24px;">
    Thank you for joining the Memoir waitlist, ${firstName}.<br>
    You're among the first to discover an app designed to help you write your life — at your own pace, with the gentle help of an AI that listens.
  </p>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:32px;">
    We'll write to you personally when your priority access is ready. In the meantime, know that your story already exists — it's just waiting to be told.
  </p>
  <p style="font-size:13px;color:#9C8E80;margin-top:40px;border-top:1px solid #EDE4D8;padding-top:24px;">
    Jérémie &amp; the Memoir team · <a href="https://getyourmemoir.com" style="color:#C4622A;text-decoration:none;">getyourmemoir.com</a>
  </p>
</div>` : isEs ? `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir</p>
  <h1 style="font-size:28px;font-weight:400;font-style:italic;margin-bottom:16px;line-height:1.3;">Tu historia está en camino.</h1>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:24px;">
    Gracias por unirte a la lista de espera de Memoir, ${firstName}.<br>
    Eres de los primeros en descubrir una app diseñada para ayudarte a escribir tu vida — a tu ritmo, con la ayuda de una IA que escucha.
  </p>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:32px;">
    Te escribiremos personalmente cuando tu acceso prioritario esté listo.
  </p>
  <p style="font-size:13px;color:#9C8E80;margin-top:40px;border-top:1px solid #EDE4D8;padding-top:24px;">
    Jérémie &amp; el equipo de Memoir · <a href="https://getyourmemoir.com" style="color:#C4622A;text-decoration:none;">getyourmemoir.com</a>
  </p>
</div>` : `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir</p>
  <h1 style="font-size:28px;font-weight:400;font-style:italic;margin-bottom:16px;line-height:1.3;">Votre histoire est en route.</h1>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:24px;">
    Merci de rejoindre la liste d'attente de Memoir, ${firstName}.<br>
    Vous faites partie des premiers à découvrir une application conçue pour vous aider à écrire votre vie — à votre rythme, avec l'aide douce d'une IA qui écoute.
  </p>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:32px;">
    Nous vous écrirons personnellement dès que votre accès prioritaire sera prêt. D'ici là, sachez que votre histoire existe déjà — elle attend juste d'être racontée.
  </p>
  <p style="font-size:13px;color:#9C8E80;margin-top:40px;border-top:1px solid #EDE4D8;padding-top:24px;">
    Jérémie &amp; l'équipe Memoir · <a href="https://getyourmemoir.com" style="color:#C4622A;text-decoration:none;">getyourmemoir.com</a>
  </p>
</div>`,
        })
        // Send admin notification email with approve link
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memoir-app-two.vercel.app'
        const cleanEmail = email.trim().toLowerCase()
        const token = generateApproveToken(cleanEmail)
        const approveUrl = `${appUrl}/api/admin/approve?email=${encodeURIComponent(cleanEmail)}&token=${token}`
        const adminUrl = `${appUrl}/admin`
        const displayName = name || '(non renseigné)'

        await resend.emails.send({
          from: 'Memoir Notifications <bonjour@memoir.app>',
          to: ADMIN_EMAILS,
          subject: `Nouvelle demande — ${name || cleanEmail}`,
          html: `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir — Accès Anticipé</p>
  <h1 style="font-size:28px;font-weight:400;font-style:italic;margin-bottom:24px;line-height:1.3;">Nouvelle demande d'accès beta</h1>
  <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
    <tr><td style="padding:8px 0;font-size:14px;color:#9C8E80;width:120px;">Prénom</td><td style="padding:8px 0;font-size:15px;font-weight:600;color:#1C1C2E;">${displayName}</td></tr>
    <tr><td style="padding:8px 0;font-size:14px;color:#9C8E80;">Email</td><td style="padding:8px 0;font-size:15px;color:#1C1C2E;"><a href="mailto:${cleanEmail}" style="color:#C4622A;">${cleanEmail}</a></td></tr>
    <tr><td style="padding:8px 0;font-size:14px;color:#9C8E80;">Source</td><td style="padding:8px 0;font-size:15px;color:#1C1C2E;">${source || 'landing'}</td></tr>
    <tr><td style="padding:8px 0;font-size:14px;color:#9C8E80;">Langue</td><td style="padding:8px 0;font-size:15px;color:#1C1C2E;">${(lang || 'fr').toUpperCase()}</td></tr>
  </table>
  <a href="${approveUrl}" style="display:inline-block;padding:14px 36px;background:#C4622A;color:#FAF8F4;border-radius:9999px;text-decoration:none;font-size:15px;font-weight:500;">✦ Approuver l'accès</a>
  <p style="font-size:13px;color:#9C8E80;margin-top:32px;border-top:1px solid #EDE4D8;padding-top:20px;">
    Ou gérez cette demande dans le <a href="${adminUrl}" style="color:#C4622A;text-decoration:none;">backoffice admin</a>.
  </p>
</div>`,
        })
      } catch (emailErr) {
        // Email failure is non-blocking — waitlist entry was saved
        console.error('[waitlist email]', emailErr)
      }

      // Notify admin (non-blocking)
      try {
        await resend.emails.send({
          from: 'Memoir Notifications <bonjour@getyourmemoir.com>',
          to: 'jeremiebenhamou@gmail.com',
          subject: `[Memoir] Nouvelle inscription — ${prenom || name || email}`,
          html: `<div style="font-family:sans-serif;max-width:480px;padding:24px;color:#1C1C2E;">
  <p style="font-size:13px;color:#C4622A;text-transform:uppercase;letter-spacing:0.1em;">✦ Memoir — Waitlist</p>
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;width:90px;">Prénom</td><td style="font-size:13px;font-weight:600;">${prenom || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;">Email</td><td style="font-size:13px;">${email}</td></tr>
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;">Ville</td><td style="font-size:13px;">${ville || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;">Pour qui</td><td style="font-size:13px;">${pour_qui || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;vertical-align:top;">Envie d'écrire</td><td style="font-size:13px;font-style:italic;">${quoi_ecrire || '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;">Source</td><td style="font-size:13px;">${source || '—'}</td></tr>
  </table>
  <a href="https://getyourmemoir.com/admin" style="display:inline-block;padding:10px 24px;background:#1C1C2E;color:white;text-decoration:none;border-radius:100px;font-size:13px;">Voir l'admin ↗</a>
</div>`,
        })
      } catch (adminEmailErr) {
        console.error('[waitlist admin email]', adminEmailErr)
      }
    }

    return NextResponse.json({ ok: true }, { headers: cors })
  } catch (err) {
    console.error('[waitlist]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors })
  }
}
