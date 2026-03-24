import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route category 1: Public — no auth required
const PUBLIC_ROUTES = [
  '/',
  '/leagues',
  '/about',
  '/contact',
  '/demo',
  '/privacy',
  '/terms',
  '/login',
  '/register',
]

// Route category 2: Auth-only — requires auth but skips approval check
const AUTH_ONLY_ROUTES = ['/pending']

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

function isAuthOnlyRoute(pathname: string) {
  return AUTH_ONLY_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('[middleware] Missing env vars:', { url: !!url, key: !!key })
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  const { pathname } = request.nextUrl

  // Public routes: no auth needed
  if (isPublicRoute(pathname)) {
    return NextResponse.next({ request })
  }

  // Skip Supabase call if no auth cookies — redirect to login
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith('sb-'))

  if (!hasAuthCookie) {
    // Auth-only routes also need auth
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    // Refresh the auth session so it doesn't expire
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Session expired or invalid — redirect to login
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Auth-only routes (e.g. /pending): skip approval + role checks
    if (isAuthOnlyRoute(pathname)) {
      return supabaseResponse
    }

    // Route category 3: Protected — requires auth + approval (for scouts)
    // Query profile for role + approval status (runs for ALL protected routes)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_approved')
      .eq('id', user.id)
      .single()

    // Handle missing profile (race condition: trigger hasn't fired yet)
    // Treat as unapproved scout → redirect to /pending
    const role = profile?.role ?? 'scout'
    const isApproved = profile?.is_approved ?? false

    // Approval gate: only check for scouts
    // Academy admins and platform admins always pass through
    if (role === 'scout' && !isApproved) {
      const pendingUrl = request.nextUrl.clone()
      pendingUrl.pathname = '/pending'
      const redirectResponse = NextResponse.redirect(pendingUrl)
      // Preserve refreshed auth cookies
      for (const cookie of supabaseResponse.cookies.getAll()) {
        redirectResponse.cookies.set(cookie)
      }
      return redirectResponse
    }

    // Role-based routing for role-scoped paths
    // Prevents wrong-role users from accessing other role panels
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

    const roleScopedPath = ['/dashboard', '/admin', '/platform'].find(
      (p) => pathname === p || pathname.startsWith(p + '/')
    )

    if (roleScopedPath) {
      const allowedRoles = PATH_ALLOWED_ROLES[roleScopedPath]
      if (allowedRoles && !allowedRoles.includes(role)) {
        const destination = ROLE_HOME[role] ?? '/dashboard'
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = destination
        const redirectResponse = NextResponse.redirect(redirectUrl)
        for (const cookie of supabaseResponse.cookies.getAll()) {
          redirectResponse.cookies.set(cookie)
        }
        return redirectResponse
      }
    }
  } catch (err) {
    // Fail-closed: redirect to login on Supabase error for protected routes
    console.error('[middleware] Supabase error:', err)
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
