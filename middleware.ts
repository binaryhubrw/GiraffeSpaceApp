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

function isTokenExpiredAfter24Hours(token: string): boolean {
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    if (!decoded.iat) return false // iat = issued at time
    
    // Check if 24 hours (86400000 milliseconds) have passed since token was issued
    const tokenIssuedAt = decoded.iat * 1000 // Convert to milliseconds
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000
    return Date.now() >= tokenIssuedAt + twentyFourHoursInMs
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
    'venues',
    '/events/check-attendance/insipector',
    '/events/check-attendance/scan'
  ]
  const isPublic = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Check for missing or expired token
  if (!isPublic && (!token || isJwtExpired(token))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    
    // Set a cookie flag to indicate token expiration for client-side logout
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set('token-expired', 'true', { 
      path: '/', 
      sameSite: 'lax',
      maxAge: 60 // 1 minute, just enough for the redirect
    })
    
    return response
  }

  // Check for 24-hour expiration
  if (!isPublic && token && isTokenExpiredAfter24Hours(token)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    
    // Set a cookie flag to indicate 24-hour expiration for client-side logout
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set('token-expired-24h', 'true', { 
      path: '/', 
      sameSite: 'lax',
      maxAge: 60 // 1 minute, just enough for the redirect
    })
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!login|register|email-confirmation|not-found).*)',
  ],
} 