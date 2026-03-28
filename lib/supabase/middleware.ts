import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
                      request.nextUrl.pathname.startsWith('/signup') ||
                      request.nextUrl.pathname.startsWith('/auth')
  const isPublicApiRoute = request.nextUrl.pathname.startsWith('/api/waitlist') ||
                          request.nextUrl.pathname.startsWith('/api/memoir') ||
                          request.nextUrl.pathname.startsWith('/api/save-session') ||
                          request.nextUrl.pathname.startsWith('/api/admin/approve')
  const isPublicRoute = request.nextUrl.pathname === '/' ||
                        request.nextUrl.pathname.startsWith('/welcome') ||
                        isPublicApiRoute

  if (!isDemoMode && !user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
