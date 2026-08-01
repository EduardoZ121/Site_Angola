'use client';

import Link from 'next/link';
import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import type { AppSessionData } from '@/modules/authentication/components/app-session';

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
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: Stat[];
  links: LinkItem[];
}) {
  return (
    <section className="kuteka-detail-panel p-5" aria-label={title}>
      <p className="kuteka-detail-eyebrow">{eyebrow}</p>
      <h2 className="kuteka-detail-title mt-1">{title}</h2>
      <p className="kuteka-detail-body mt-1">{subtitle}</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.label} className="kuteka-role-stat">
            <p className="kuteka-role-stat__value">{stat.value}</p>
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

/**
 * Role-aware home strip — different cockpit per profile before the shared Feed.
 */
export function RoleHomeDashboard({ session }: RoleHomeDashboardProps) {
  const roles = session.roles;
  const isSuper = roles.includes('super_administrator');
  const isAdmin = roles.includes('administrator') || isSuper;
  const isAgent = roles.includes('certified_agent');
  const isPartner = roles.includes('patrimonial_partner');
  const isClient = roles.includes('client');

  if (isSuper) {
    return (
      <DashboardShell
        eyebrow="Superadministrador"
        title="Painel executivo Kuteka"
        subtitle="Visão global da plataforma — utilizadores, patrimónios, contratos e crescimento."
        stats={[
          { label: 'Utilizadores', value: '1.2k+' },
          { label: 'Patrimónios activos', value: '35' },
          { label: 'Contratos', value: '128' },
          { label: 'Receita demo (AOA)', value: '2.4B' },
          { label: 'Províncias activas', value: '8' },
          { label: 'Agentes top', value: '12' },
          { label: 'Parceiros top', value: '9' },
          { label: 'Crescimento MoM', value: '+18%' },
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

  if (isAdmin) {
    return (
      <DashboardShell
        eyebrow="Administrador"
        title="Comando da plataforma"
        subtitle="Utilizadores, patrimónios, contratos, denúncias e aprovações."
        stats={[
          { label: 'Utilizadores', value: '248' },
          { label: 'Patrimónios', value: '35' },
          { label: 'Contratos', value: '14' },
          { label: 'Pendentes confiança', value: '3' },
        ]}
        links={[
          { href: '/app/admin', label: 'Painel admin', primary: true },
          { href: '/app/admin/utilizadores', label: 'Utilizadores' },
          { href: '/app/confianca/revisao', label: 'Aprovações' },
          { href: '/app/contratos', label: 'Contratos' },
        ]}
      />
    );
  }

  if (isAgent) {
    return (
      <DashboardShell
        eyebrow="Agente Certificado"
        title="O seu pipeline no terreno"
        subtitle="Imóveis atribuídos, visitas, clientes, desempenho e tarefas."
        stats={[
          { label: 'Imóveis atribuídos', value: '6' },
          { label: 'Visitas esta semana', value: '4' },
          { label: 'Clientes activos', value: '11' },
          { label: 'Comissões (demo)', value: '1.8M' },
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
        eyebrow="Parceiro Patrimonial"
        title="Os seus patrimónios"
        subtitle="Publicações, visitas, contratos activos, rendimento e reputação."
        stats={[
          { label: 'Imóveis publicados', value: '35' },
          { label: 'Visitas (30d)', value: '42' },
          { label: 'Contratos activos', value: '2' },
          { label: 'Avaliação média', value: '4.8★' },
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
        eyebrow="Cliente"
        title="A sua jornada habitacional"
        subtitle="Pesquisas, favoritos, propostas, contratos, pagamentos e avaliações."
        stats={[
          { label: 'Pesquisas guardadas', value: '3' },
          { label: 'Interesses', value: '5' },
          { label: 'Contratos', value: '3' },
          { label: 'Avaliações a fazer', value: '1' },
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
        { label: 'Módulos prontos', value: '6' },
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
