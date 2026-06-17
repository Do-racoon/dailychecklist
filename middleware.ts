import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const protected_ = ['/dashboard', '/setup', '/settings', '/import', '/analytics']
  if (protected_.some(p => pathname.startsWith(p)) && !token) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/setup/:path*', '/settings/:path*', '/import/:path*', '/analytics/:path*'],
}
