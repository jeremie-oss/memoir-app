export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

const ADMIN_EMAILS = ['jeremiebenhamou@gmail.com', 'jeremie@the-tech-nation.com']

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateToken(email: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return crypto.createHmac('sha256', secret).update(email.toLowerCase()).digest('hex').slice(0, 32)
}

function generatePassword(name: string): string {
  const base = name ? name.split(' ')[0] : 'Memoir'
  const rand = Math.random().toString(36).slice(2, 6)
  const num = Math.floor(Math.random() * 90 + 10)
  return `${base}${rand}!${num}`
}

/**
 * GET /api/admin/approve?email=...&token=...
 * Called when admin clicks "Approuver l'accès" in notification email.
 * Creates the user account and sends welcome email with credentials.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  const token = req.nextUrl.searchParams.get('token')

  if (!email || !token) {
    return htmlResponse('Lien invalide', 'Paramètres manquants.', 400)
  }

  // Verify HMAC token
  const expected = generateToken(email)
  if (token !== expected) {
    return htmlResponse('Lien invalide', 'Le token de vérification est incorrect.', 403)
  }

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const alreadyExists = existingUsers?.users?.some(u => u.email === email)
  if (alreadyExists) {
    return htmlResponse(
      'Déjà approuvé',
      `Le compte pour <strong>${email}</strong> existe déjà. L'utilisateur peut se connecter.`,
      200
    )
  }

  // Get waitlist info for the name
  const { data: waitlistEntry } = await supabase
    .from('waitlist')
    .select('name, lang')
    .eq('email', email)
    .single()

  const name = waitlistEntry?.name || ''
  const lang = waitlistEntry?.lang || 'fr'
  const password = generatePassword(name)

  // Create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (error) {
    console.error('[admin/approve] create user error:', error.message)
    return htmlResponse('Erreur', `Impossible de créer le compte : ${error.message}`, 500)
  }

  // Create project
  const userId = data.user.id
  const { error: projErr } = await supabase.from('projects').insert({
    user_id: userId,
    title: name ? `Le livre de ${name}` : 'Mon livre',
    status: 'active',
  })

  if (projErr) {
    console.error('[admin/approve] project error:', projErr.message)
  }

  // Mark as promoted in waitlist
  await supabase.from('waitlist').update({ promoted: true }).eq('email', email)

  // Send welcome email with credentials
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const firstName = (name || 'vous').split(' ')[0]
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://memoir-app-two.vercel.app'

      await resend.emails.send({
        from: 'Jérémie · Memoir <bonjour@memoir.app>',
        to: email,
        subject: lang === 'en'
          ? `${firstName}, your Memoir access is ready ✦`
          : lang === 'es'
          ? `${firstName}, tu acceso a Memoir está listo ✦`
          : `${firstName}, votre accès Memoir est prêt ✦`,
        html: buildWelcomeEmail({ firstName, email, password, appUrl, lang }),
      })
    } catch (emailErr) {
      console.error('[admin/approve] email error:', emailErr)
    }
  }

  // Notify admin
  const adminNotice = name ? `${name} (${email})` : email
  return htmlResponse(
    'Accès approuvé ✦',
    `Le compte de <strong>${adminNotice}</strong> a été créé.<br>Un email avec ses identifiants lui a été envoyé.`,
    200
  )
}

function htmlResponse(title: string, message: string, status: number): Response {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Memoir</title>
  <style>
    body{font-family:Georgia,serif;background:#FAF8F4;color:#1C1C2E;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px}
    .card{max-width:440px;text-align:center}
    .logo{font-size:24px;font-weight:700;letter-spacing:.06em;margin-bottom:32px}
    .logo em{font-style:normal;color:#C4622A}
    h1{font-size:28px;font-weight:400;font-style:italic;margin-bottom:16px}
    p{font-size:15px;line-height:1.8;color:#7A4F32}
    a.btn{display:inline-block;margin-top:24px;padding:12px 32px;background:#1C1C2E;color:#FAF8F4;border-radius:9999px;text-decoration:none;font-size:14px}
    a.btn:hover{background:#C4622A}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">M<em>.</em>emoir</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="btn" href="/admin">Ouvrir le backoffice</a>
  </div>
</body>
</html>`
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function buildWelcomeEmail({ firstName, email, password, appUrl, lang }: {
  firstName: string; email: string; password: string; appUrl: string; lang: string
}): string {
  if (lang === 'en') {
    return `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir — Early Access</p>
  <h1 style="font-size:28px;font-weight:400;font-style:italic;margin-bottom:16px;line-height:1.3;">Your access is ready, ${firstName}.</h1>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:24px;">
    Your Memoir account has been approved. You can now sign in and start writing your story.
  </p>
  <div style="background:#EDE4D8;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="font-size:13px;color:#9C8E80;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">Your credentials</p>
    <p style="font-size:15px;color:#1C1C2E;margin:0 0 4px;"><strong>Email:</strong> ${email}</p>
    <p style="font-size:15px;color:#1C1C2E;margin:0;"><strong>Password:</strong> ${password}</p>
  </div>
  <p style="font-size:13px;color:#9C8E80;margin-bottom:24px;">You can change your password anytime in Settings.</p>
  <a href="${appUrl}/login" style="display:inline-block;padding:14px 36px;background:#C4622A;color:#FAF8F4;border-radius:9999px;text-decoration:none;font-size:15px;font-weight:500;">Sign in to Memoir</a>
  <p style="font-size:13px;color:#9C8E80;margin-top:40px;border-top:1px solid #EDE4D8;padding-top:24px;">
    Jérémie &amp; the Memoir team
  </p>
</div>`
  }

  if (lang === 'es') {
    return `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir — Acceso Anticipado</p>
  <h1 style="font-size:28px;font-weight:400;font-style:italic;margin-bottom:16px;line-height:1.3;">Tu acceso está listo, ${firstName}.</h1>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:24px;">
    Tu cuenta Memoir ha sido aprobada. Ya puedes conectarte y empezar a escribir tu historia.
  </p>
  <div style="background:#EDE4D8;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="font-size:13px;color:#9C8E80;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">Tus credenciales</p>
    <p style="font-size:15px;color:#1C1C2E;margin:0 0 4px;"><strong>Email:</strong> ${email}</p>
    <p style="font-size:15px;color:#1C1C2E;margin:0;"><strong>Contraseña:</strong> ${password}</p>
  </div>
  <p style="font-size:13px;color:#9C8E80;margin-bottom:24px;">Puedes cambiar tu contraseña en cualquier momento en Ajustes.</p>
  <a href="${appUrl}/login" style="display:inline-block;padding:14px 36px;background:#C4622A;color:#FAF8F4;border-radius:9999px;text-decoration:none;font-size:15px;font-weight:500;">Conectarse a Memoir</a>
  <p style="font-size:13px;color:#9C8E80;margin-top:40px;border-top:1px solid #EDE4D8;padding-top:24px;">
    Jérémie &amp; el equipo de Memoir
  </p>
</div>`
  }

  // Default: French
  return `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir — Accès Anticipé</p>
  <h1 style="font-size:28px;font-weight:400;font-style:italic;margin-bottom:16px;line-height:1.3;">Votre accès est prêt, ${firstName}.</h1>
  <p style="font-size:15px;line-height:1.8;color:#7A4F32;margin-bottom:24px;">
    Votre compte Memoir a été approuvé. Vous pouvez maintenant vous connecter et commencer à écrire votre histoire.
  </p>
  <div style="background:#EDE4D8;border-radius:12px;padding:24px;margin-bottom:24px;">
    <p style="font-size:13px;color:#9C8E80;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.1em;">Vos identifiants</p>
    <p style="font-size:15px;color:#1C1C2E;margin:0 0 4px;"><strong>Email :</strong> ${email}</p>
    <p style="font-size:15px;color:#1C1C2E;margin:0;"><strong>Mot de passe :</strong> ${password}</p>
  </div>
  <p style="font-size:13px;color:#9C8E80;margin-bottom:24px;">Vous pourrez modifier votre mot de passe à tout moment dans les Réglages.</p>
  <a href="${appUrl}/login" style="display:inline-block;padding:14px 36px;background:#C4622A;color:#FAF8F4;border-radius:9999px;text-decoration:none;font-size:15px;font-weight:500;">Se connecter à Memoir</a>
  <p style="font-size:13px;color:#9C8E80;margin-top:40px;border-top:1px solid #EDE4D8;padding-top:24px;">
    Jérémie &amp; l'équipe Memoir
  </p>
</div>`
}
