import type { Metadata } from 'next';
import { AppHomeClient } from '@/modules/authentication/components/AppHomeClient';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';

export const metadata: Metadata = {
  title: 'O seu espaço',
  robots: { index: false, follow: false },
};

/**
 * Authenticated home stub — one purpose: confirm entry to the platform and next paths.
 * Full dashboards are out of PRD-001 scope.
 */
export default async function AppHomePage() {
  let displayName: string | null = null;

  if (isSupabaseConfigured()) {
    try {
      const { createServerClient } = await import('@/lib/supabase/client');
      const client = await createServerClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (user) {
        const { data: profile } = await client
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle();
        displayName = profile?.display_name ?? user.email ?? null;
      }
    } catch {
      displayName = null;
    }
  }

  return <AppHomeClient displayName={displayName} />;
}
