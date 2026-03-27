import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Server-side Supabase client — uses anon key with permissive RLS insert policy
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALLOWED_ORIGINS = [
  'https://memoir.app',
  'https://www.memoir.app',
  'https://memoir-app-two.vercel.app',
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

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) })
}

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req)
  try {
    const { email, name, source, lang, snippet } = await req.json()

    if (!email || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400, headers: cors })
    }

    const { error } = await supabase.from('waitlist').upsert(
      {
        email: email.trim().toLowerCase(),
        name: name || null,
        source: source || 'unknown',
        lang: lang || 'fr',
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
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const firstName = (name || 'vous').split(' ')[0]
        const isEn = lang === 'en'
        const isEs = lang === 'es'

        await resend.emails.send({
          from: 'Jérémie · Memoir <bonjour@memoir.app>',
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
    Jérémie &amp; the Memoir team · <a href="https://memoir-app-two.vercel.app" style="color:#C4622A;text-decoration:none;">memoir-app-two.vercel.app</a>
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
    Jérémie &amp; el equipo de Memoir · <a href="https://memoir-app-two.vercel.app" style="color:#C4622A;text-decoration:none;">memoir-app-two.vercel.app</a>
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
    Jérémie &amp; l'équipe Memoir · <a href="https://memoir-app-two.vercel.app" style="color:#C4622A;text-decoration:none;">memoir-app-two.vercel.app</a>
  </p>
</div>`,
        })
      } catch (emailErr) {
        // Email failure is non-blocking — waitlist entry was saved
        console.error('[waitlist email]', emailErr)
      }
    }

    return NextResponse.json({ ok: true }, { headers: cors })
  } catch (err) {
    console.error('[waitlist]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors })
  }
}
