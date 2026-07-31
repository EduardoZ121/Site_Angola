import type { Metadata } from 'next';
import { Heading, Text } from '@kuteka/ui';
import { getAuthCopy } from '@/modules/authentication/content';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';

export const metadata: Metadata = {
  title: 'O seu espaço',
  robots: { index: false, follow: false },
};

export default async function AppHomePage() {
  const copy = getAuthCopy();
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

  return (
    <div className="flex flex-col gap-4">
      <Heading level={1}>{copy.app.title}</Heading>
      {displayName ? (
        <Text className="text-lg text-slate-700">
          {copy.app.welcome}, {displayName}
        </Text>
      ) : null}
      <Text>{copy.app.active}</Text>
      <Text className="text-slate-600">{copy.app.stub}</Text>
    </div>
  );
}
