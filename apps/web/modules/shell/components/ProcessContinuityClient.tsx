'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EXPERIENCE_LABELS, type ExperienceMode } from '../role-experience';
import { ROLE_HOME_CTA_LABELS_PT, ROLE_OPERATING_MATRIX } from '../role-operating-matrix';
import { SessionStatusGate } from './SessionStatusGate';
import { useRoleExperience } from './RoleExperienceProvider';
import { OwnerDelegationPanel } from '@/modules/kocc/components/OwnerDelegationPanel';

const ORDER: ExperienceMode[] = [
  'founder',
  'super_administrator',
  'administrator',
  'supervisor',
  'accountant',
  'certified_agent',
  'patrimonial_partner',
  'service_provider',
  'client',
  'client_partner',
];

const CONTINUITY: { who: string; does: string; href: string }[] = [
  {
    who: 'Superadministrador',
    does: 'Mantém a operação diária, a fila crítica e a moderação.',
    href: '/app/super',
  },
  {
    who: 'Administrador',
    does: 'Decide publicações e acompanha contratos. Não muda o Founder.',
    href: '/app/admin',
  },
  {
    who: 'Supervisor',
    does: 'Vê a carteira que a base já lhe mostra. Esta página não abre a carteira de outro agente.',
    href: '/app/admin',
  },
  {
    who: 'Contabilista',
    does: 'Prepara o fecho e anexa documentos. Não movimenta dinheiro nem paga à AGT.',
    href: '/app/contabilista',
  },
  {
    who: 'Agente',
    does: 'Continua os imóveis e interesses que lhe estão atribuídos.',
    href: '/app/agente',
  },
  {
    who: 'Mesa do jurista',
    does: 'Lê as minutas. O parecer continua por aprovar fora da plataforma.',
    href: '/app/juridico',
  },
];

const GAPS = [
  'Não existe «ver como utilizador». Entrar na conta de outra pessoa não foi ligado.',
  'Não existe acesso temporário que salte as regras da base. Quem não vê um processo continua sem o ver.',
  'As mensagens ficam na conta. Ainda não há duas caixas, uma por papel, na mesma pessoa.',
  'Comissões, prazos fiscais e prémios de crescimento não são definidos aqui. Pontos, convites e vouchers estão descritos e desligados.',
  'Quando uma publicação tem prazo, esse prazo é o que já está gravado na fila. Esta página não inventa horas.',
];

export function ProcessContinuityClient() {
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const { mode } = useRoleExperience();
  const [query, setQuery] = useState('');
  const ready = sessionStatus === 'ready' && !!session;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ORDER.filter((key) => {
      if (!q) return true;
      const profile = ROLE_OPERATING_MATRIX[key];
      const blob = [EXPERIENCE_LABELS[key], profile.mission, profile.reportsTo, ...profile.mustDo, ...profile.mustNot]
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }, [query]);

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">Operação</p>
          <Heading level={1}>Processos e continuidade</Heading>
          <Text className="mt-2 text-slate-700">
            Quem faz o quê, com o papel que já existe. O papel activo nesta sessão é{' '}
            {EXPERIENCE_LABELS[mode]}. Se o Founder não estiver, a operação segue pelos papéis abaixo.
            Nada disto muda permissões nem liga dinheiro.
          </Text>
        </header>

        {ready ? (
          <>
            <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Se o Founder não estiver</h2>
              <ul className="flex flex-col gap-3">
                {CONTINUITY.map((row) => (
                  <li key={row.who} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.who}</p>
                      <p className="text-sm text-slate-600">{row.does}</p>
                    </div>
                    <Link href={row.href} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}>
                      Abrir
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <OwnerDelegationPanel />

            <section className="kuteka-detail-panel flex flex-col gap-2 p-5">
              <h2 className="text-sm font-semibold text-slate-900">O que esta página não faz</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                {GAPS.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>

            <section className="kuteka-detail-panel flex flex-col gap-3 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Dados mínimos</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-semibold">Classe</th>
                    <th className="py-2 pr-3 font-semibold">Quem</th>
                    <th className="py-2 font-semibold">Estado real</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-t border-slate-100">
                    <td className="py-2 pr-3">A própria conta</td>
                    <td className="py-2 pr-3">A pessoa</td>
                    <td className="py-2">Perfil e confiança da própria sessão.</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="py-2 pr-3">Operação atribuída</td>
                    <td className="py-2 pr-3">Agente e supervisor visíveis</td>
                    <td className="py-2">A base decide. A ficha não inventa a carteira.</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="py-2 pr-3">Institucional</td>
                    <td className="py-2 pr-3">Founder e Super</td>
                    <td className="py-2">Founder Center, Super e auditoria.</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="py-2 pr-3">Bancário e AGT</td>
                    <td className="py-2 pr-3">Ainda ninguém</td>
                    <td className="py-2">Sem cofre bancário de clientes e sem pagamento à AGT.</td>
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="py-2 pr-3">Documento de identidade</td>
                    <td className="py-2 pr-3">Fila de confiança</td>
                    <td className="py-2">Não há botão «ver BI» fora de quem já revê documentos.</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="process-search">
                Procurar papel
              </label>
              <input
                id="process-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Nome, missão ou limite"
                className="kuteka-ops-input w-full"
              />
            </div>

            {shown.length === 0 ? (
              <p className="text-sm text-slate-600">Nenhum papel neste filtro.</p>
            ) : null}

            {shown.map((key) => {
              const profile = ROLE_OPERATING_MATRIX[key];
              const current = key === mode;
              return (
                <section
                  key={key}
                  className={cn(
                    'kuteka-detail-panel flex flex-col gap-3 p-5',
                    current && 'border-brand-400',
                  )}
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {current ? 'Papel activo' : 'Papel'}
                    </p>
                    <h2 className="text-base font-semibold text-slate-900">{EXPERIENCE_LABELS[key]}</h2>
                    <p className="text-sm text-slate-700">{profile.mission}</p>
                    <p className="text-sm text-slate-500">Reporta a: {profile.reportsTo}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Faz</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                        {profile.mustDo.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-500">Não faz</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                        {profile.mustNot.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{profile.cockpitHint}</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.homeCtas.map((cta) => (
                      <Link
                        key={cta.href + cta.labelKey}
                        href={cta.href}
                        className={cn(
                          buttonVariants({ variant: cta.primary ? 'primary' : 'secondary', size: 'sm' }),
                        )}
                      >
                        {ROLE_HOME_CTA_LABELS_PT[cta.labelKey]}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
