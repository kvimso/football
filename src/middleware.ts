import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[middleware] Missing env vars:', { url: !!url, key: !!key })
    return NextResponse.next({ request })
  }

  // Skip Supabase call if no auth cookies — anonymous users don't need session refresh
  const hasAuthCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-'))

  // Redirect unauthenticated users away from protected paths
  if (!hasAuthCookie) {
    const protectedPrefixes = ['/players', '/matches', '/clubs', '/dashboard', '/admin', '/platform']
    const { pathname } = request.nextUrl
    if (protectedPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh the auth session so it doesn't expire
    await supabase.auth.getUser()
  } catch (err) {
    console.error('[middleware] Supabase error:', err)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
