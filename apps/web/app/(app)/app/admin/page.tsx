import type { Metadata } from 'next';
import { Heading, Text } from '@kuteka/ui';
import { canAccessAdminPanel } from '@kuteka/auth';
import { getAuthCopy } from '@/modules/authentication/content';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';

export const metadata: Metadata = {
  title: 'Administração',
  robots: { index: false, follow: false },
};

export default async function AppAdminPage() {
  const copy = getAuthCopy();
  let allowed = false;

  if (isSupabaseConfigured()) {
    try {
      const { createServerClient } = await import('@/lib/supabase/client');
      const { getAuthorizationContext } = await import('@/lib/auth/authorization');
      const client = await createServerClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (user) {
        const ctx = await getAuthorizationContext(user.id, user.email ?? null);
        allowed = canAccessAdminPanel(ctx);
      }
    } catch {
      allowed = false;
    }
  }

  if (!allowed) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.app.adminTitle}</Heading>
        <Text>
          Não tem permissão para aceder a esta área (admin.panel). Se acredita que isto é um erro,
          contacte a Kuteka.
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading level={1}>{copy.app.adminTitle}</Heading>
      <Text className="text-sm text-slate-500">Permissão: admin.panel</Text>
      <Text>{copy.app.adminStub}</Text>
    </div>
  );
}
