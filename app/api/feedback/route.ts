import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_EMAIL = 'jeremiebenhamou@gmail.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://memoir-app-two.vercel.app'

export async function POST(req: NextRequest) {
  try {
    const { message, rating, page_url, page_context } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    // Get authenticated user if any (optional)
    let userId: string | null = null
    let userEmail: string | null = null
    try {
      const serverSb = await createServerSupabase()
      const { data: { user } } = await serverSb.auth.getUser()
      if (user) {
        userId = user.id
        userEmail = user.email || null
      }
    } catch {
      // Non-blocking — proceed without user info
    }

    const { error } = await supabase.from('feedbacks').insert({
      user_id: userId,
      user_email: userEmail,
      page_url: page_url || null,
      page_context: page_context || null,
      message: message.trim(),
      rating: rating || null,
    })

    if (error) {
      console.error('[feedback insert]', error.message)
      return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 })
    }

    // Notify admin (non-blocking)
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const ratingEmoji = rating === 'positive' ? '👍' : rating === 'negative' ? '😕' : '🤔'
        const pageLabel = page_context?.page || page_url || 'inconnue'

        await resend.emails.send({
          from: 'Memoir Beta <bonjour@getyourmemoir.com>',
          to: ADMIN_EMAIL,
          subject: `[Memoir Feedback] ${ratingEmoji} ${userEmail || 'Anonyme'} — ${pageLabel}`,
          html: `
<div style="font-family:'Georgia',serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#1C1C2E;background:#FAF8F4;">
  <p style="font-size:13px;color:#C4622A;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:32px;">✦ Memoir — Feedback Beta</p>
  <p style="font-size:36px;margin:0 0 20px;">${ratingEmoji}</p>
  <blockquote style="margin:0 0 28px;padding:16px 20px;background:#F5EFE0;border-left:3px solid #C4622A;border-radius:0 8px 8px 0;font-size:15px;line-height:1.7;font-style:italic;color:#1C1C2E;">
    &ldquo;${message.trim()}&rdquo;
  </blockquote>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;width:100px;">Utilisateur</td><td style="padding:6px 0;font-size:13px;">${userEmail || 'Anonyme'}</td></tr>
    <tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;">Page</td><td style="padding:6px 0;font-size:13px;font-family:monospace;">${pageLabel}</td></tr>
    ${page_context ? `<tr><td style="padding:6px 0;color:#7A4F32;font-size:13px;vertical-align:top;">Contexte</td><td style="padding:6px 0;font-size:12px;color:#9C8E80;font-family:monospace;">${JSON.stringify(page_context)}</td></tr>` : ''}
  </table>
  <p style="font-size:12px;color:#9C8E80;margin-top:32px;border-top:1px solid #EDE4D8;padding-top:20px;">
    Voir tous les feedbacks dans le <a href="${SITE_URL}/admin" style="color:#C4622A;text-decoration:none;">backoffice admin</a>.
  </p>
</div>`,
        })
      } catch (emailErr) {
        console.error('[feedback email]', emailErr)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[feedback]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
