import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Add atob for base64 decoding

function isJwtExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    if (!decoded.exp) return false
    // exp is in seconds since epoch
    return Date.now() >= decoded.exp * 1000
  } catch {
    // If token is malformed, treat as expired
    return true
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value

  // List of public routes
  const publicPaths = [
    '/login',
    '/register',
    '/email-confirmation',
    '/not-found',
    '/',
    'events',
    'venues'
  ]
  const isPublic = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Check for missing or expired token
  if (!isPublic && (!token || isJwtExpired(token))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!login|register|email-confirmation|not-found).*)',
  ],
} 