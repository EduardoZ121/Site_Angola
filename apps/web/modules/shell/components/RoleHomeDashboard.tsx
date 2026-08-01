'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import type { AppSessionData } from '@/modules/authentication/components/app-session';
import { createBrowserClient } from '@/lib/supabase/client';

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
  contracts: number;
  activeContracts: number;
  interests: number;
  reviews: number;
  reviewAvg: number | null;
  views30: number;
  visits30: number;
  proposals30: number;
  users: number;
  trustPending: number;
};

async function loadLiveStats(session: AppSessionData): Promise<LiveStats> {
  const client = createBrowserClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  const uid = user?.id;
  const empty: LiveStats = {
    properties: 0,
    activeProperties: 0,
    contracts: 0,
    activeContracts: 0,
    interests: 0,
    reviews: 0,
    reviewAvg: null,
    views30: 0,
    visits30: 0,
    proposals30: 0,
    users: 0,
    trustPending: 0,
  };

  try {
    if (!uid) return empty;
    const isPartner = session.roles.includes('patrimonial_partner');
    const isClient = session.roles.includes('client');
    const isAdmin =
      session.roles.includes('administrator') || session.roles.includes('super_administrator');
    const isAgent = session.roles.includes('certified_agent');

    if (isPartner) {
      const props = await client
        .from('properties')
        .select('id, status', { count: 'exact' })
        .eq('owner_id', uid)
        .is('deleted_at', null);
      const propRows = (props.data as { id: string; status: string }[]) ?? [];
      const propIds = propRows.map((p) => p.id);
      const active = propRows.filter((p) => p.status === 'active').length;

      let contracts = 0;
      let activeContracts = 0;
      let reviews = 0;
      let reviewAvg: number | null = null;
      let views30 = 0;
      let visits30 = 0;
      let proposals30 = 0;

      if (propIds.length) {
        const [cAll, cActive, rev, metrics] = await Promise.all([
          client
            .from('property_contracts')
            .select('id', { count: 'exact', head: true })
            .in('property_id', propIds)
            .is('deleted_at', null),
          client
            .from('property_contracts')
            .select('id', { count: 'exact', head: true })
            .in('property_id', propIds)
            .in('status', ['active', 'signed', 'in_progress'])
            .is('deleted_at', null),
          client.from('contract_reviews').select('rating').in('property_id', propIds),
          client
            .from('property_metrics')
            .select('views_30d, visits_30d, proposals_30d')
            .in('property_id', propIds),
        ]);
        contracts = cAll.count ?? 0;
        activeContracts = cActive.count ?? 0;
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

      return {
        ...empty,
        properties: props.count ?? propRows.length,
        activeProperties: active,
        contracts,
        activeContracts,
        reviews,
        reviewAvg,
        views30,
        visits30,
        proposals30,
      };
    }

    if (isClient) {
      const [prefs, interests, contracts] = await Promise.all([
        client
          .from('client_preferences')
          .select('user_id', { count: 'exact', head: true })
          .eq('user_id', uid),
        client
          .from('property_interests')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', uid),
        client
          .from('property_contracts')
          .select('id', { count: 'exact', head: true })
          .eq('client_id', uid)
          .is('deleted_at', null),
      ]);
      return {
        ...empty,
        interests: interests.count ?? 0,
        contracts: contracts.count ?? 0,
        properties: prefs.count ?? 0,
      };
    }

    if (isAgent) {
      const [assignments, contracts] = await Promise.all([
        client
          .from('agent_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', uid)
          .is('deleted_at', null),
        client
          .from('property_contracts')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', uid)
          .is('deleted_at', null),
      ]);
      return {
        ...empty,
        properties: assignments.count ?? 0,
        contracts: contracts.count ?? 0,
      };
    }

    if (isAdmin) {
      const [users, props, contracts, trust] = await Promise.all([
        client.from('profiles').select('id', { count: 'exact', head: true }),
        client
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .eq('status', 'active'),
        client
          .from('property_contracts')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null),
        client
          .from('trust_documents')
          .select('id', { count: 'exact', head: true })
          .in('status', ['submitted', 'under_review']),
      ]);
      return {
        ...empty,
        users: users.count ?? 0,
        activeProperties: props.count ?? 0,
        contracts: contracts.count ?? 0,
        trustPending: trust.count ?? 0,
      };
    }
  } catch {
    // fall through
  }
  return empty;
}

/**
 * Role-aware home strip — live counts from Supabase when available.
 */
export function RoleHomeDashboard({ session }: RoleHomeDashboardProps) {
  const roles = session.roles;
  const isSuper = roles.includes('super_administrator');
  const isAdmin = roles.includes('administrator') || isSuper;
  const isAgent = roles.includes('certified_agent');
  const isPartner = roles.includes('patrimonial_partner');
  const isClient = roles.includes('client');

  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void loadLiveStats(session).then((data) => {
      if (!cancelled) {
        setStats(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  const s = stats;

  if (isSuper || isAdmin) {
    return (
      <DashboardShell
        loading={loading}
        eyebrow={isSuper ? 'Superadministrador' : 'Administrador'}
        title={isSuper ? 'Painel executivo Kuteka' : 'Comando da plataforma'}
        subtitle="Utilizadores, patrimónios activos, contratos e aprovações — dados da plataforma."
        stats={[
          { label: 'Utilizadores', value: String(s?.users ?? 0) },
          { label: 'Patrimónios activos', value: String(s?.activeProperties ?? 0) },
          { label: 'Contratos', value: String(s?.contracts ?? 0) },
          { label: 'Pendentes confiança', value: String(s?.trustPending ?? 0) },
        ]}
        links={[
          { href: '/app/admin', label: 'Operações', primary: true },
          { href: '/app/admin/utilizadores', label: 'Utilizadores' },
          { href: '/app/contratos', label: 'Contratos' },
          { href: '/app/confianca/revisao', label: 'Aprovações' },
        ]}
      />
    );
  }

  if (isAgent) {
    return (
      <DashboardShell
        loading={loading}
        eyebrow="Agente Certificado"
        title="O seu pipeline no terreno"
        subtitle="Imóveis atribuídos e contratos sob a sua responsabilidade."
        stats={[
          { label: 'Imóveis atribuídos', value: String(s?.properties ?? 0) },
          { label: 'Contratos', value: String(s?.contracts ?? 0) },
          { label: 'Visitas (métricas)', value: String(s?.visits30 ?? 0) },
          { label: 'Propostas', value: String(s?.proposals30 ?? 0) },
        ]}
        links={[
          { href: '/app/agente', label: 'Pipeline', primary: true },
          { href: '/app/agente/explorar', label: 'Explorar inventário' },
          { href: '/app/contratos', label: 'Contratos' },
          { href: '/app/habitacao/explorar', label: 'Habitação' },
        ]}
      />
    );
  }

  if (isPartner) {
    return (
      <DashboardShell
        loading={loading}
        eyebrow="Parceiro Patrimonial"
        title="Os seus patrimónios"
        subtitle="Publicações, visitas, contratos, rendimento e reputação — dados reais da conta."
        stats={[
          { label: 'Imóveis', value: String(s?.properties ?? 0) },
          { label: 'Publicados', value: String(s?.activeProperties ?? 0) },
          { label: 'Visualizações (30d)', value: String(s?.views30 ?? 0) },
          { label: 'Visitas (30d)', value: String(s?.visits30 ?? 0) },
          { label: 'Propostas (30d)', value: String(s?.proposals30 ?? 0) },
          { label: 'Contratos activos', value: String(s?.activeContracts ?? 0) },
          {
            label: 'Avaliação média',
            value: s?.reviewAvg != null ? `${s.reviewAvg.toFixed(1)}★` : '—',
          },
          { label: 'Avaliações', value: String(s?.reviews ?? 0) },
        ]}
        links={[
          { href: '/app/patrimonios', label: 'Os meus anúncios', primary: true },
          { href: '/app/patrimonios/novo', label: 'Publicar' },
          { href: '/app/contratos', label: 'Contratos' },
          { href: '/app/confianca', label: 'Confiança' },
        ]}
      />
    );
  }

  if (isClient) {
    return (
      <DashboardShell
        loading={loading}
        eyebrow="Cliente"
        title="A sua jornada habitacional"
        subtitle="Preferências, interesses e contratos na Kuteka."
        stats={[
          { label: 'Preferências', value: String(s?.properties ?? 0) },
          { label: 'Interesses', value: String(s?.interests ?? 0) },
          { label: 'Contratos', value: String(s?.contracts ?? 0) },
          { label: 'Explorar', value: 'Habitação' },
        ]}
        links={[
          { href: '/app/habitacao/explorar', label: 'Explorar', primary: true },
          { href: '/app/contratos', label: 'Contratos' },
          { href: '/app/confianca', label: 'Verificar conta' },
          { href: '/app/agente', label: 'Agente' },
        ]}
      />
    );
  }

  return (
    <DashboardShell
      eyebrow="Kuteka"
      title="Active o seu papel"
      subtitle="Escolha Cliente ou Parceiro Patrimonial para personalizar o painel e o feed."
      stats={[
        { label: 'Módulos prontos', value: '6+' },
        { label: 'Feed contínuo', value: 'On' },
        { label: 'Confiança', value: 'KYC' },
        { label: 'Contratos', value: 'N5' },
      ]}
      links={[
        { href: '/auth/onboarding/papeis', label: 'Activar papéis', primary: true },
        { href: '/app/confianca', label: 'Confiança' },
      ]}
    />
  );
}
