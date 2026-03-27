import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Server-side Supabase client — uses anon key with permissive RLS insert policy
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALLOWED_ORIGINS = [
  'https://memoir.app',
  'https://www.memoir.app',
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

    return NextResponse.json({ ok: true }, { headers: cors })
  } catch (err) {
    console.error('[waitlist]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: cors })
  }
}
