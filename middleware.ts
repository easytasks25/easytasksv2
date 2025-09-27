import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // For now, we'll handle authentication client-side
  // This middleware can be enhanced later with proper Supabase auth helpers
  
  // Basic route protection - redirect to signin for protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard') || 
      req.nextUrl.pathname.startsWith('/organizations') ||
      req.nextUrl.pathname.startsWith('/api/protected')) {
    // Let the client-side ProtectedRoute component handle the redirect
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}