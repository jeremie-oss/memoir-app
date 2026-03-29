import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Demo mode: pas d'auth, accès direct
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    if (pathname === '/') return NextResponse.redirect(new URL('/home', request.url))
    return NextResponse.next()
  }

  // Landing page at root — redirecte les utilisateurs connectés vers /home
  if (pathname === '/') {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return NextResponse.redirect(new URL('/home', request.url))
    return NextResponse.rewrite(new URL('/landing.html', request.url))
  }

  // Toutes les autres routes: updateSession gère la protection auth
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
