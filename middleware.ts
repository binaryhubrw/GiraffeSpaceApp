import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  if (!isPublic && !token) {
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