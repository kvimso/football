import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[middleware] Missing env vars:', { url: !!url, key: !!key })
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
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
    const { data: { user } } = await supabase.auth.getUser()

    // Role-based routing for authenticated users on role-scoped paths
    // Prevents layout redirect() calls that trigger React 19 Turbopack dev-mode bug
    if (user) {
      const { pathname } = request.nextUrl
      const roleScopedPath = ['/dashboard', '/admin', '/platform'].find(
        p => pathname === p || pathname.startsWith(p + '/')
      )

      if (roleScopedPath) {
        const ROLE_HOME: Record<string, string> = {
          scout: '/dashboard',
          academy_admin: '/admin',
          platform_admin: '/platform',
        }
        const PATH_ALLOWED_ROLES: Record<string, string[]> = {
          '/dashboard': ['scout'],
          '/admin': ['academy_admin'],
          '/platform': ['platform_admin'],
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role ?? 'scout'
        const allowedRoles = PATH_ALLOWED_ROLES[roleScopedPath]

        if (allowedRoles && !allowedRoles.includes(role)) {
          const destination = ROLE_HOME[role] ?? '/dashboard'
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = destination
          const redirectResponse = NextResponse.redirect(redirectUrl)
          // Preserve refreshed auth cookies on the redirect response
          for (const cookie of supabaseResponse.cookies.getAll()) {
            redirectResponse.cookies.set(cookie)
          }
          return redirectResponse
        }
      }
    }
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
