import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest): NextResponse {
  // NextAuth v5 session cookies:
  //  - dev:  "authjs.session-token"
  //  - prod: "__Secure-authjs.session-token"
  const hasSession =
    request.cookies.has('authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token');

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('authRequired', 'true');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard', '/prompts/new', '/prompts/:path*/edit'],
};
