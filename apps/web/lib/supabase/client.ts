import { createBrowserSupabaseClient, createServerSupabaseClient } from '@kuteka/database';
import { requireSupabasePublicEnv } from '@/lib/env';

export function createBrowserClient() {
  return createBrowserSupabaseClient(requireSupabasePublicEnv());
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
