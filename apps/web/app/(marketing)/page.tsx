import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading,
  Text,
} from '@kuteka/ui';
import Link from 'next/link';

export default function FoundationPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100 via-white to-slate-100 dark:from-brand-950 dark:via-slate-950 dark:to-slate-900"
      />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-4">
          <p className="font-mono text-sm font-medium tracking-wide text-brand-600">
            KUTEKA · KEOS
          </p>
          <Heading level={1}>Foundation Ready</Heading>
          <Text>
            Infraestrutura FASE 1 operacional. A Landing Page (PASSO 1 + 1A) será implementada após
            a revisão técnica desta fundação.
          </Text>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estado da fundação</CardTitle>
            <CardDescription>
              Monorepo, Design System, Auth/RBAC preparados, health API
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="brand">Next.js App Router</Badge>
            <Badge variant="brand">pnpm + Turborepo</Badge>
            <Badge variant="success">Multi-Role RBAC</Badge>
            <Badge variant="info">Supabase ready</Badge>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/api/health"
            className="inline-flex h-10 items-center justify-center rounded-kuteka bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Ver /api/health
          </Link>
          <Link
            href="/dev/ui"
            className="inline-flex h-10 items-center justify-center rounded-kuteka bg-slate-100 px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-700"
          >
            Catálogo UI
          </Link>
        </div>
      </div>
    </main>
  );
}
