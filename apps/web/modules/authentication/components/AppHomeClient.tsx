'use client';

import Link from 'next/link';
import { Heading, Text, Badge, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { PlatformFeed } from '@/modules/shell/components/PlatformFeed';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAuthCopy } from '../content';
import { useAppSession, roleLabelPt } from './app-session';

const MODULE_DEFS = [
  {
    key: 'patrimonios',
    title: 'Patrimónios',
    description: 'Publique anúncios com fotografias, preço e galeria.',
    href: '/app/patrimonios',
    permission: 'properties.manage' as const,
  },
  {
    key: 'habitacao',
    title: 'Habitação',
    description: 'Explore inventário activo e demonstre interesse.',
    href: '/app/habitacao/explorar',
    permission: 'housing.explore' as const,
  },
  {
    key: 'agente',
    title: 'Agente',
    description: 'Pipeline, visitas e acompanhamentos no terreno.',
    href: '/app/agente',
    permission: null,
  },
  {
    key: 'confianca',
    title: 'Confiança',
    description: 'Verifique a conta — Em análise, Aprovado ou Rejeitado.',
    href: '/app/confianca',
    permission: 'trust.manage' as const,
  },
  {
    key: 'contratos',
    title: 'Contratos',
    description: 'Minutas, aceitação e preparação de pagamento.',
    href: '/app/contratos',
    permission: 'contracts.manage' as const,
  },
] as const;

/**
 * /app home — shortcuts + continuous marketplace feed.
 */
export function AppHomeClient() {
  const copy = getAuthCopy();
  const { session, status, error } = useAppSession();

  const roleLabels: Record<string, string> = {
    client: copy.onboarding.roles.client,
    patrimonial_partner: copy.onboarding.roles.partner,
    certified_agent: 'Agente Certificado',
    administrator: 'Administrador',
  };

  if (status === 'error' || (status === 'ready' && !session)) {
    return (
      <div className="flex flex-col gap-4">
        <header className="kuteka-glass flex flex-col gap-2 p-5">
          <Heading level={1}>{copy.app.title}</Heading>
          <div
            role="alert"
            className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            {error ?? copy.app.loadError}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
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
        </header>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-2 p-5">
          <Heading level={1}>{copy.app.title}</Heading>
          <p className="text-sm text-slate-600">
            Atalhos para actuar — e um feed vivo da plataforma por baixo.
          </p>
        </header>
        <SoftListSlot pending minHeightClassName="min-h-[28rem]" />
      </div>
    );
  }

  if (!session) return null;

  const greetingName = session.displayName;
  const email = session.email;
  const canManage = session.permissions.includes('properties.manage');
  const canHousing = session.permissions.includes('housing.explore');
  const canAgent = session.permissions.includes('agent.operate');
  const canTrust = session.permissions.includes('trust.manage');
  const canContracts = session.permissions.includes('contracts.manage');

  const quickActions = [
    canManage
      ? {
          key: 'activate',
          href: '/app/patrimonios/novo',
          label: copy.app.quickActivateProperty,
          primary: true,
        }
      : null,
    canHousing
      ? {
          key: 'housing',
          href: '/app/habitacao/explorar',
          label: copy.app.quickExploreHousing,
          primary: !canManage,
        }
      : null,
    canContracts
      ? {
          key: 'contracts',
          href: '/app/contratos',
          label: 'Gerir contratos',
          primary: !canManage && !canHousing,
        }
      : null,
    canAgent
      ? {
          key: 'agent',
          href: '/app/agente',
          label: copy.app.quickAgent,
          primary: !canManage && !canHousing && !canContracts,
        }
      : null,
    canTrust
      ? {
          key: 'trust',
          href: '/app/confianca',
          label: copy.app.quickTrust,
          primary: !canManage && !canHousing && !canContracts && !canAgent,
        }
      : null,
    {
      key: 'roles',
      href: '/auth/onboarding/papeis',
      label: copy.app.quickRoles,
      primary: false,
    },
  ].filter(Boolean) as Array<{ key: string; href: string; label: string; primary: boolean }>;

  return (
    <div className="flex flex-col gap-8">
      <header className="kuteka-glass flex flex-col gap-2 p-5">
        <Heading level={1}>{copy.app.title}</Heading>
        <p className="text-xl font-medium tracking-tight text-slate-800 sm:text-2xl">
          {greetingName ? `${copy.app.welcome}, ${greetingName}` : copy.app.welcomeAnonymous}
        </p>
        <p className="text-sm text-slate-600">
          Atalhos para actuar — e um feed vivo da plataforma por baixo.
        </p>
        {email ? (
          <p className="text-sm text-slate-500">
            <span className="text-slate-400">{copy.app.emailLabel}: </span>
            {email}
          </p>
        ) : null}
      </header>

      <section
        className="kuteka-glass flex flex-wrap items-center gap-2 px-4 py-3"
        aria-label={copy.app.accountSummaryAria}
      >
        <Badge variant="success">{copy.app.active}</Badge>
        {session.roles.length > 0 ? (
          session.roles.map((code) => (
            <Badge key={code} variant="brand">
              {roleLabelPt(code, roleLabels)}
            </Badge>
          ))
        ) : (
          <Text className="text-sm text-slate-600">{copy.app.noRoles}</Text>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="today-heading">
        <div className="kuteka-glass flex flex-col gap-1 p-4">
          <h2 id="today-heading" className="text-sm font-semibold tracking-wide text-slate-800">
            {copy.app.todayTitle}
          </h2>
          <Text className="text-sm text-slate-500">{copy.app.todayHint}</Text>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <li key={action.key}>
              <Link
                href={action.href}
                className={cn(
                  buttonVariants({ variant: action.primary ? 'primary' : 'secondary' }),
                  'w-full justify-center',
                )}
              >
                {action.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="modules-heading">
        <div className="kuteka-glass flex flex-col gap-1 p-4">
          <h2 id="modules-heading" className="text-sm font-semibold tracking-wide text-slate-800">
            {copy.app.modulesTitle}
          </h2>
          <Text className="text-sm text-slate-500">{copy.app.modulesHint}</Text>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {MODULE_DEFS.map((mod) => {
            const available =
              mod.permission == null || session.permissions.includes(mod.permission);
            return (
              <li key={mod.key}>
                {available ? (
                  <Link
                    href={mod.href}
                    className="kuteka-glass flex h-full items-start justify-between gap-4 px-4 py-4 transition-shadow hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{mod.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{mod.description}</p>
                    </div>
                    <span className="shrink-0 rounded-kuteka border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800">
                      {copy.app.moduleAvailable}
                    </span>
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className="kuteka-glass flex h-full items-start justify-between gap-4 px-4 py-4 opacity-70"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700">{mod.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{mod.description}</p>
                    </div>
                    <span className="shrink-0 rounded-kuteka border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                      {copy.app.moduleUnavailable}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="feed-heading">
        <div className="kuteka-glass flex flex-col gap-1 p-4">
          <h2 id="feed-heading" className="text-sm font-semibold tracking-wide text-slate-800">
            Feed da plataforma
          </h2>
          <Text className="text-sm text-slate-500">
            Scroll contínuo com patrimónios, destaques, recomendações e novidades.
          </Text>
        </div>
        <PlatformFeed canExplore={canHousing} />
      </section>

      <FlowNextSteps
        title="Continue o percurso Kuteka"
        steps={[
          ...(canHousing
            ? [{ href: '/app/habitacao/explorar', label: 'Explorar habitação', primary: true }]
            : [{ href: '/app', label: 'Explorar o painel', primary: true }]),
          ...(canManage ? [{ href: '/app/patrimonios/novo', label: 'Publicar património' }] : []),
          ...(canContracts ? [{ href: '/app/contratos', label: 'Preparar contrato' }] : []),
          ...(canTrust ? [{ href: '/app/confianca', label: 'Verificar conta' }] : []),
          { href: '/auth/onboarding/papeis', label: 'Activar papéis' },
        ]}
      />
    </div>
  );
}
