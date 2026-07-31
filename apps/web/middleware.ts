import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@kuteka/database';

/**
 * Correlation id + optional Supabase session refresh + light /app guards.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const correlationId = request.headers.get('x-correlation-id') ?? crypto.randomUUID();
  response.headers.set('x-correlation-id', correlationId);

  if (
    request.nextUrl.pathname.startsWith('/dev') &&
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS !== 'true'
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;

  if (supabaseUrl && supabaseAnon) {
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.headers.set('x-correlation-id', correlationId);
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (path.startsWith('/app') && !user) {
      const login = new URL('/auth/entrar', request.url);
      login.searchParams.set('next', `${path}${request.nextUrl.search}`);
      const redirect = NextResponse.redirect(login);
      redirect.headers.set('x-correlation-id', correlationId);
      return redirect;
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
