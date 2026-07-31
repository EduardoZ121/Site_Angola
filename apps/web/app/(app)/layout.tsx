import type { ReactNode } from 'react';
import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { isSupabaseConfigured } from '@/modules/authentication/lib/supabase-config';
import { getAuthCopy } from '@/modules/authentication/content';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const copy = getAuthCopy();

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <p className="font-mono text-sm font-semibold tracking-[0.2em] text-brand-600">KUTEKA</p>
        <Heading level={1}>{copy.app.title}</Heading>
        <Text>{copy.app.configMissing}</Text>
        <Link href="/" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
          Voltar à Landing
        </Link>
      </div>
    );
  }

  try {
    const { createServerClient } = await import('@/lib/supabase/client');
    const client = await createServerClient();
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return (
        <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
          <Heading level={1}>{copy.login.title}</Heading>
          <Text>É necessário entrar para aceder a esta área.</Text>
          <Link
            href="/auth/entrar?next=%2Fapp"
            className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
          >
            {copy.login.submit}
          </Link>
        </div>
      );
    }
  } catch {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6 py-16">
        <Heading level={1}>{copy.app.title}</Heading>
        <Text>{copy.common.networkError}</Text>
        <Link href="/" className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}>
          Voltar à Landing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4">
        <Link
          href="/app"
          className="font-mono text-sm font-semibold tracking-[0.2em] text-brand-600"
        >
          KUTEKA
        </Link>
        <form action="/auth/sair" method="post">
          <button type="submit" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
            {copy.logout.action}
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12">{children}</main>
    </div>
  );
}
