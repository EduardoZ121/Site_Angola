import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware prepared for PRD-001 auth guards (session refresh, route protection).
 * Currently: correlation id + pass-through. Session refresh when Supabase is configured
 * and Autorização de Implementação do PRD-001 estiver emitida.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();
  response.headers.set('x-correlation-id', correlationId);

  // Dev tools routes: only meaningful in non-production builds
  if (
    request.nextUrl.pathname.startsWith('/dev') &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS !== 'true'
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
