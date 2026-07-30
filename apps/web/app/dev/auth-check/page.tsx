import { env } from '@/lib/env';
import { Heading, Text } from '@kuteka/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default function DevAuthCheckPage() {
  if (process.env.NODE_ENV === 'production' && !env.NEXT_PUBLIC_ENABLE_DEV_TOOLS) {
    notFound();
  }

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <main className="mx-auto max-w-xl space-y-6 px-6 py-16">
      <Heading level={1}>Auth check</Heading>
      <Text>
        Página técnica de desenvolvimento. A UI de autenticação de produto pertence ao PRD-001 (após
        Engineering Gate + Autorização de Implementação).
      </Text>
      <dl className="space-y-2 font-mono text-sm">
        <div className="flex justify-between gap-4 border-b border-slate-200 py-2 dark:border-slate-800">
          <dt>Supabase public env</dt>
          <dd>{supabaseConfigured ? 'configured' : 'missing'}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-slate-200 py-2 dark:border-slate-800">
          <dt>Session</dt>
          <dd>not wired (PRD-001)</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-slate-200 py-2 dark:border-slate-800">
          <dt>RBAC source</dt>
          <dd>PostgreSQL RPCs (P0-1)</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-slate-200 py-2 dark:border-slate-800">
          <dt>Audit writes</dt>
          <dd>write_audit_log only (P0-2)</dd>
        </div>
      </dl>
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        Voltar
      </Link>
    </main>
  );
}
