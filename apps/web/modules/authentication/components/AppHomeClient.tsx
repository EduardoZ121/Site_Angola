'use client';

import Link from 'next/link';
import {
  Heading,
  Text,
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  buttonVariants,
} from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { getAuthCopy } from '../content';
import { useAppSession, roleLabelPt } from './app-session';

const MODULE_LINKS = [
  {
    key: 'patrimonios',
    title: 'Patrimónios',
    description: 'Activar e acompanhar património na plataforma.',
    href: '/app/patrimonios' as string | null,
  },
  {
    key: 'confianca',
    title: 'Confiança',
    description: 'Documentos e verificação para relações seguras.',
    href: null,
  },
  {
    key: 'habitacao',
    title: 'Habitação',
    description: 'Jornada do Cliente — procurar e gerir habitação.',
    href: null,
  },
] as const;

/**
 * /app home stub — visual hierarchy for authenticated entry (QA Review 002).
 */
export function AppHomeClient() {
  const copy = getAuthCopy();
  const { session, status, error } = useAppSession();

  const roleLabels: Record<string, string> = {
    client: copy.onboarding.roles.client,
    patrimonial_partner: copy.onboarding.roles.partner,
  };

  if (status === 'loading') {
    return <Text className="text-slate-600">{copy.common.loading}</Text>;
  }

  if (status === 'error' || !session) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.app.title}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error ?? copy.app.loadError}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/auth/entrar?next=%2Fapp"
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            {copy.login.submit}
          </Link>
          <Link
            href="/auth/onboarding/papeis"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            {copy.app.ctaRoles}
          </Link>
        </div>
      </div>
    );
  }

  const greetingName = session.displayName;
  const email = session.email;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Heading level={1}>{copy.app.title}</Heading>
        <p className="text-xl font-medium tracking-tight text-slate-800 sm:text-2xl">
          {greetingName ? `${copy.app.welcome}, ${greetingName}` : copy.app.welcomeAnonymous}
        </p>
        {email ? (
          <p className="text-sm text-slate-500">
            <span className="text-slate-400">{copy.app.emailLabel}: </span>
            {email}
          </p>
        ) : null}
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{copy.app.accountStatusTitle}</CardTitle>
            <CardDescription>{copy.app.accountStatusHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="success">{copy.app.active}</Badge>
          </CardContent>
        </Card>

        <Card className="shadow-none">
          <CardHeader>
            <CardTitle className="text-base">{copy.app.rolesLabel}</CardTitle>
            <CardDescription>{copy.app.rolesHint}</CardDescription>
          </CardHeader>
          <CardContent>
            {session.roles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {session.roles.map((code) => (
                  <Badge key={code} variant="brand">
                    {roleLabelPt(code, roleLabels)}
                  </Badge>
                ))}
              </div>
            ) : (
              <Text className="text-sm text-slate-600">{copy.app.noRoles}</Text>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="upcoming-modules-heading">
        <div className="flex flex-col gap-1">
          <h2
            id="upcoming-modules-heading"
            className="text-sm font-semibold tracking-wide text-slate-800"
          >
            {copy.app.upcomingTitle}
          </h2>
          <Text className="text-sm text-slate-500">{copy.app.stub}</Text>
        </div>

        <ul className="grid gap-3 sm:grid-cols-1">
          {MODULE_LINKS.map((mod) => (
            <li key={mod.key}>
              {mod.href ? (
                <Link
                  href={mod.href}
                  className="flex items-start justify-between gap-4 rounded-kuteka border border-slate-200 bg-white px-4 py-4 transition-colors hover:border-brand-300"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{mod.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{mod.description}</p>
                  </div>
                  <span className="shrink-0 rounded-kuteka border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                    Disponível
                  </span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex items-start justify-between gap-4 rounded-kuteka border border-slate-200 bg-slate-50/80 px-4 py-4 opacity-80"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">{mod.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{mod.description}</p>
                  </div>
                  <span className="shrink-0 rounded-kuteka border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                    {copy.app.moduleUnavailable}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants({ variant: 'secondary' }))}>
          {copy.app.ctaLanding}
        </Link>
        <Link href="/auth/onboarding/perfil" className={cn(buttonVariants({ variant: 'ghost' }))}>
          {copy.app.ctaProfile}
        </Link>
      </div>
    </div>
  );
}
