'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import type { AppSessionData } from '@/modules/authentication/components/app-session';
import { createBrowserClient } from '@/lib/supabase/client';
import { experienceLabel, modeBadgeLabel } from '@/modules/i18n/experience-labels';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import type { AppLocale } from '@/modules/i18n/types';
import type { ExperienceMode } from '../role-experience';
import { useRoleExperience } from './RoleExperienceProvider';

type RoleHomeDashboardProps = {
  session: AppSessionData;
};

type Stat = { label: string; value: string };
type LinkItem = { href: string; label: string; primary?: boolean };

function DashboardShell({
  eyebrow,
  title,
  subtitle,
  stats,
  links,
  loading,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: Stat[];
  links: LinkItem[];
  loading?: boolean;
}) {
  return (
    <section className="kuteka-detail-panel p-5" aria-label={title}>
      <p className="kuteka-detail-eyebrow">{eyebrow}</p>
      <h2 className="kuteka-detail-title mt-1">{title}</h2>
      <p className="kuteka-detail-body mt-1">{subtitle}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="kuteka-role-stat">
            <p className="kuteka-role-stat__value">{loading ? '…' : stat.value}</p>
            <p className="kuteka-role-stat__label">{stat.label}</p>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href + link.label}
            href={link.href}
            className={cn(
              buttonVariants({ variant: link.primary ? 'primary' : 'secondary', size: 'sm' }),
              'w-fit',
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

type LiveStats = {
  properties: number;
  activeProperties: number;
  clientContracts: number;
  clientActiveContracts: number;
  partnerContracts: number;
  partnerActiveContracts: number;
  interests: number;
  reviews: number;
  reviewAvg: number | null;
  views30: number;
  visits30: number;
  proposals30: number;
  users: number;
  trustPending: number;
  assignments: number;
};

function isActiveContractStatus(status: string): boolean {
  return ['active', 'signed', 'in_progress', 'in_force', 'em_vigor'].includes(status);
}

async function loadLiveStats(uid: string): Promise<LiveStats> {
  const client = createBrowserClient();
  const empty: LiveStats = {
    properties: 0,
    activeProperties: 0,
    clientContracts: 0,
    clientActiveContracts: 0,
    partnerContracts: 0,
    partnerActiveContracts: 0,
    interests: 0,
    reviews: 0,
    reviewAvg: null,
    views30: 0,
    visits30: 0,
    proposals30: 0,
    users: 0,
    trustPending: 0,
    assignments: 0,
  };

  try {
    const [props, clientContracts, partnerContracts, interests, assignments, users, trust] =
      await Promise.all([
        client.from('properties').select('id, status').eq('owner_id', uid).is('deleted_at', null),
        client
          .from('property_contracts')
          .select('id, status', { count: 'exact' })
          .eq('client_id', uid)
          .is('deleted_at', null),
        client
          .from('property_contracts')
          .select('id, status', { count: 'exact' })
          .eq('partner_id', uid)
          .is('deleted_at', null),
        client
          .from('property_interests')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', uid),
        client
          .from('agent_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', uid)
          .is('deleted_at', null),
        client.from('profiles').select('id', { count: 'exact', head: true }),
        client
          .from('trust_documents')
          .select('id', { count: 'exact', head: true })
          .in('status', ['submitted', 'under_review']),
      ]);

    const propRows = (props.data as { id: string; status: string }[]) ?? [];
    const propIds = propRows.map((p) => p.id);
    let reviews = 0;
    let reviewAvg: number | null = null;
    let views30 = 0;
    let visits30 = 0;
    let proposals30 = 0;

    if (propIds.length) {
      const [rev, metrics] = await Promise.all([
        client.from('contract_reviews').select('rating').in('property_id', propIds),
        client
          .from('property_metrics')
          .select('views_30d, visits_30d, proposals_30d')
          .in('property_id', propIds),
      ]);
      const ratings = ((rev.data as { rating: number }[]) ?? []).map((r) => Number(r.rating));
      reviews = ratings.length;
      reviewAvg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
      for (const m of (metrics.data as {
        views_30d: number;
        visits_30d: number;
        proposals_30d: number;
      }[]) ?? []) {
        views30 += Number(m.views_30d) || 0;
        visits30 += Number(m.visits_30d) || 0;
        proposals30 += Number(m.proposals_30d) || 0;
      }
    }

    const partnerRows = (partnerContracts.data as { status: string }[]) ?? [];
    const clientRows = (clientContracts.data as { status: string }[]) ?? [];

    return {
      ...empty,
      properties: propRows.length,
      activeProperties: propRows.filter((p) => p.status === 'active').length,
      clientContracts: clientContracts.count ?? clientRows.length,
      clientActiveContracts: clientRows.filter((c) => isActiveContractStatus(c.status)).length,
      partnerContracts: partnerContracts.count ?? partnerRows.length,
      partnerActiveContracts: partnerRows.filter((c) => isActiveContractStatus(c.status)).length,
      interests: interests.count ?? 0,
      reviews,
      reviewAvg,
      views30,
      visits30,
      proposals30,
      users: users.count ?? 0,
      trustPending: trust.count ?? 0,
      assignments: assignments.count ?? 0,
    };
  } catch {
    return empty;
  }
}

function ClientPanel({ s, loading }: { s: LiveStats | null; loading: boolean }) {
  return (
    <DashboardShell
      loading={loading}
      eyebrow="Cliente"
      title="Jornada habitacional"
      subtitle="Pesquisas, interesses, visitas e contratos como comprador ou arrendatário."
      stats={[
        { label: 'Interesses / favoritos', value: String(s?.interests ?? 0) },
        { label: 'Contratos (cliente)', value: String(s?.clientContracts ?? 0) },
        { label: 'Contratos activos', value: String(s?.clientActiveContracts ?? 0) },
        { label: 'Propostas / visitas (30d)', value: String(s?.proposals30 ?? 0) },
      ]}
      links={[
        { href: '/app/habitacao/explorar', label: 'Explorar Habitação', primary: true },
        { href: '/app/habitacao?vista=interesses', label: 'Favoritos' },
        { href: '/app/habitacao?vista=visitas', label: 'Visitas' },
        { href: '/app/contratos', label: 'Contratos' },
        { href: '/auth/onboarding/perfil', label: 'Conta' },
      ]}
    />
  );
}

function PartnerPanel({ s, loading }: { s: LiveStats | null; loading: boolean }) {
  return (
    <DashboardShell
      loading={loading}
      eyebrow="Parceiro Patrimonial"
      title="Gestão do património"
      subtitle="Patrimónios, receitas, contratos activos, Índice Kuteka e reputação."
      stats={[
        { label: 'Patrimónios', value: String(s?.properties ?? 0) },
        { label: 'Publicados', value: String(s?.activeProperties ?? 0) },
        { label: 'Visualizações (30d)', value: String(s?.views30 ?? 0) },
        { label: 'Visitas (30d)', value: String(s?.visits30 ?? 0) },
        { label: 'Contratos (parceiro)', value: String(s?.partnerContracts ?? 0) },
        { label: 'Contratos activos', value: String(s?.partnerActiveContracts ?? 0) },
        {
          label: 'Avaliação média',
          value: s?.reviewAvg != null ? `${s.reviewAvg.toFixed(1)}★` : '—',
        },
        { label: 'Avaliações', value: String(s?.reviews ?? 0) },
      ]}
      links={[
        { href: '/app/patrimonios', label: 'Patrimónios', primary: true },
        { href: '/app/patrimonios/novo', label: 'Ativar Património' },
        { href: '/app/contratos', label: 'Contratos' },
        { href: '/app/confianca', label: 'Confiança' },
      ]}
    />
  );
}

function panelForMode(
  mode: ExperienceMode,
  s: LiveStats | null,
  loading: boolean,
  locale: AppLocale,
): React.ReactNode {
  switch (mode) {
    case 'client':
      return <ClientPanel s={s} loading={loading} />;
    case 'patrimonial_partner':
      return <PartnerPanel s={s} loading={loading} />;
    case 'client_partner':
      return (
        <div className="flex flex-col gap-4">
          <p className="kuteka-detail-meta px-1">
            {modeBadgeLabel('client_partner', locale)} — {experienceLabel('client_partner', locale)}
          </p>
          <ClientPanel s={s} loading={loading} />
          <PartnerPanel s={s} loading={loading} />
        </div>
      );
    case 'certified_agent':
      return (
        <DashboardShell
          loading={loading}
          eyebrow="Agente Certificado"
          title="Pipeline no terreno"
          subtitle="Imóveis atribuídos, visitas, propostas e avaliações técnicas."
          stats={[
            { label: 'Imóveis atribuídos', value: String(s?.assignments ?? 0) },
            {
              label: 'Contratos',
              value: String((s?.clientContracts ?? 0) + (s?.partnerContracts ?? 0)),
            },
            { label: 'Visitas (30d)', value: String(s?.visits30 ?? 0) },
            { label: 'Propostas', value: String(s?.proposals30 ?? 0) },
          ]}
          links={[
            { href: '/app/agente', label: 'Pipeline', primary: true },
            { href: '/app/agente/explorar', label: 'Inventário' },
            { href: '/app/contratos', label: 'Contratos' },
            { href: '/app/habitacao/explorar', label: 'Habitação' },
          ]}
        />
      );
    case 'administrator':
    case 'super_administrator':
      return (
        <DashboardShell
          loading={loading}
          eyebrow={modeBadgeLabel(mode, locale)}
          title="Comando operacional"
          subtitle="Utilizadores, patrimónios, contratos, auditoria e aprovações."
          stats={[
            { label: 'Utilizadores', value: String(s?.users ?? 0) },
            { label: 'Patrimónios publicados', value: String(s?.activeProperties ?? 0) },
            {
              label: 'Contratos',
              value: String((s?.clientContracts ?? 0) + (s?.partnerContracts ?? 0)),
            },
            { label: 'Pendentes confiança', value: String(s?.trustPending ?? 0) },
          ]}
          links={[
            { href: '/app/admin', label: 'Administração', primary: true },
            { href: '/app/admin/utilizadores', label: 'Utilizadores' },
            { href: '/app/confianca/revisao', label: 'Aprovações' },
            { href: '/app/contratos', label: 'Contratos' },
          ]}
        />
      );
    default:
      return <ClientPanel s={s} loading={loading} />;
  }
}

/**
 * Role-aware home — widgets change with active experience (Mudar de Papel).
 */
export function RoleHomeDashboard({ session }: RoleHomeDashboardProps) {
  const { mode } = useRoleExperience();
  const { locale } = useLocale();
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const client = createBrowserClient();
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setStats(null);
          setLoading(false);
        }
        return;
      }
      const data = await loadLiveStats(user.id);
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [session.roles, mode]);

  return <>{panelForMode(mode, stats, loading, locale)}</>;
}
