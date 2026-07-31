import { createBrowserSupabaseClient, createServerSupabaseClient } from '@kuteka/database';
import { requireSupabasePublicEnv } from '@/lib/env';
import { requirePublicSupabaseEnv } from '@/modules/authentication/lib/public-config';

export function createBrowserClient() {
  // Prefer runtime kuteka-config.js on static hosts; fall back to build-time env.
  return createBrowserSupabaseClient(requirePublicSupabaseEnv());
}

export async function createServerClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  return createServerSupabaseClient(requireSupabasePublicEnv(), {
    getAll: () => cookieStore.getAll(),
    setAll: (toSet) => {
      try {
        for (const c of toSet) {
          cookieStore.set(c.name, c.value, c.options);
        }
      } catch {
        // Called from a Server Component where cookies are read-only — middleware will refresh.
      }
    },
  });
}
