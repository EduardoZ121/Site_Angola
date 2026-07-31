import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';

/**
 * F4 — logout. Prefer POST; GET also signs out for simple links.
 */
async function handleSignOut(request: Request) {
  const url = new URL(request.url);
  const redirectTo = new URL('/', url.origin);
  redirectTo.searchParams.set('logout', '1');

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(redirectTo);
  }

  try {
    const { createServerClient } = await import('@/lib/supabase/client');
    const client = await createServerClient();
    await client.auth.signOut();
  } catch {
    // Still redirect home — session may already be gone
  }

  return NextResponse.redirect(redirectTo);
}

export async function POST(request: Request) {
  return handleSignOut(request);
}

export async function GET(request: Request) {
  return handleSignOut(request);
}
