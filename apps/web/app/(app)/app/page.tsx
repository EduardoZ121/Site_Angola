import type { Metadata } from 'next';
import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { getAuthCopy } from '@/modules/authentication/content';
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
  const copy = getAuthCopy();
  let displayName: string | null = null;
  const configured = isSupabaseConfigured();

  if (configured) {
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Heading level={1}>{copy.app.title}</Heading>
        {displayName ? (
          <Text className="text-lg text-slate-700">
            {copy.app.welcome}, {displayName}
          </Text>
        ) : (
          <Text className="text-lg text-slate-700">{copy.app.welcome}</Text>
        )}
        <Text className="text-slate-600">{copy.app.active}</Text>
      </div>

      {!configured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-medium">Backend de autenticação ainda não ligado</p>
          <p className="mt-1 text-amber-900/90">{copy.app.configMissing}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <Text className="text-sm font-medium uppercase tracking-wide text-slate-500">
          Em preparação
        </Text>
        <ul className="flex flex-col gap-2 text-slate-700">
          <li className="border-b border-slate-100 py-3">Patrimónios — activar e acompanhar</li>
          <li className="border-b border-slate-100 py-3">Confiança — documentos e verificação</li>
          <li className="border-b border-slate-100 py-3">Habitação — jornada do Cliente</li>
        </ul>
        <Text className="text-sm text-slate-500">{copy.app.stub}</Text>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Voltar à Landing
        </Link>
        {!configured ? (
          <Link href="/auth/registar" className={cn(buttonVariants({ variant: 'primary' }))}>
            Ver fluxo Criar conta
          </Link>
        ) : null}
      </div>
    </div>
  );
}
