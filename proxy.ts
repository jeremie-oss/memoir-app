import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Landing page at root
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/landing.html', request.url))
  }

  // Demo mode: tout le monde entre, pas d'auth Supabase
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
