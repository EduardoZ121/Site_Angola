import type { Metadata } from 'next';
import Link from 'next/link';
import { buttonVariants, Heading, Text } from '@kuteka/ui';
import { cn } from '@kuteka/shared';

export const metadata: Metadata = {
  title: 'Autenticação',
  description: 'Acesso à plataforma Kuteka — em preparação.',
  robots: { index: false, follow: false },
};

export default async function AuthPlaceholderPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === 'entrar' ? 'Entrar' : 'Começar';

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <p className="font-mono text-sm font-medium tracking-wide text-brand-600">KUTEKA</p>
      <Heading level={1}>{mode}</Heading>
      <Text>
        A autenticação de produto será implementada no PRD-001, após a conclusão do backlog P0
        (fonte única de RBAC, integridade de auditoria e CI activo).
      </Text>
      <Text className="text-sm text-slate-500">
        Nenhum fluxo autenticado de negócio está disponível nesta fase.
      </Text>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants({ variant: 'primary' }))}>
          Voltar à Landing
        </Link>
        <Link href="/#diferenca" className={cn(buttonVariants({ variant: 'secondary' }))}>
          Explorar a Kuteka
        </Link>
      </div>
    </main>
  );
}
