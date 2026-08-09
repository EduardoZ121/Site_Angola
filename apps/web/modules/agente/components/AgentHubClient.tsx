'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAgenteCopy } from '../content';
import { AGENT_DEMO_PIPELINE } from '../demo/pipeline';
import {
  getAgentPreferences,
  listMyAssignments,
  saveAgentPreferences,
  type AgentAssignmentRow,
} from '../services/agent-client';

const PURPOSES = ['rent', 'sale', 'both'] as const;

export function AgentHubClient() {
  const { locale } = useLocale();
  const copy = getAgenteCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canOperate = sessionStatus === 'ready' && !!session?.permissions.includes('agent.operate');
  const isAdmin = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');
  const accessPending = sessionStatus === 'loading';

  const [purpose, setPurpose] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [assignments, setAssignments] = useState<AgentAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canOperate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [prefs, list] = await Promise.all([getAgentPreferences(), listMyAssignments()]);
      if (cancelled) return;
      if (!prefs.ok) setError(prefs.message);
      else if (prefs.data) {
        setPurpose(prefs.data.purpose ?? '');
        setProvince(prefs.data.province ?? '');
        setCity(prefs.data.city ?? '');
      }
      if (!list.ok) setError(list.message);
      else setAssignments(list.data);
      setLoading(false);
    }
    if (sessionStatus === 'error') {
      setLoading(false);
      return;
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [canOperate, sessionStatus]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await saveAgentPreferences({
      purpose: purpose ? (purpose as 'rent' | 'sale' | 'both') : null,
      province,
      city,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.saved);
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.title}</Heading>
            <Text className="text-slate-600">{copy.subtitle}</Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
            >
              {copy.viewHousingInventory}
            </Link>
            {canOperate ? (
              <Link
                href="/app/agente/explorar"
                className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
              >
                {copy.explore}
              </Link>
            ) : null}
          </div>
        </header>

        {accessPending ? <SoftListSlot pending /> : null}

        {!canOperate && sessionStatus === 'ready' ? (
          <>
            <div
              role="alert"
              className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
            >
              <p>{copy.needAgent}</p>
              <p className="mt-2 text-amber-900/80">{copy.requestAgentHint}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href="/contacto"
                  className={cn(
                    buttonVariants({ variant: 'secondary', size: 'sm' }),
                    'inline-flex',
                  )}
                >
                  {copy.requestAgent}
                </Link>
                {isAdmin ? (
                  <Link
                    href="/app/admin/utilizadores"
                    className={cn(
                      buttonVariants({ variant: 'primary', size: 'sm' }),
                      'inline-flex',
                    )}
                  >
                    {copy.activateAgentAdmin}
                  </Link>
                ) : null}
              </div>
            </div>

            <section className="flex flex-col gap-4" aria-labelledby="agent-demo-heading">
              <div>
                <h2 id="agent-demo-heading" className="text-sm font-semibold text-slate-800">
                  {copy.demoTitle}
                </h2>
                <Text className="mt-1 text-sm text-slate-500">{copy.demoHint}</Text>
              </div>

              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {AGENT_DEMO_PIPELINE.pipeline.map((stage) => (
                  <li
                    key={stage.id}
                    className="rounded-kuteka border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">{stage.stage}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{stage.count}</p>
                  </li>
                ))}
              </ul>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">{copy.assignmentsTitle}</h3>
                  <ul className="flex flex-col gap-2">
                    {AGENT_DEMO_PIPELINE.assignments.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="flex items-center justify-between gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-3 hover:border-brand-300"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="font-mono text-xs text-slate-500">{item.code}</p>
                          </div>
                          <Badge variant="brand">{item.status}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{copy.demoVisits}</h3>
                    <ul className="mt-2 flex flex-col gap-2">
                      {AGENT_DEMO_PIPELINE.visits.map((v) => (
                        <li
                          key={v.id}
                          className="rounded-kuteka border border-slate-200 bg-white px-4 py-3 text-sm"
                        >
                          <p className="font-medium text-slate-900">{v.title}</p>
                          <p className="text-slate-500">
                            {v.when} · {v.where}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">{copy.demoAgenda}</h3>
                    <ul className="mt-2 flex flex-col gap-2">
                      {AGENT_DEMO_PIPELINE.agenda.map((a) => (
                        <li
                          key={a.id}
                          className="rounded-kuteka border border-slate-200 bg-white px-4 py-3 text-sm"
                        >
                          <p className="font-medium text-slate-900">{a.title}</p>
                          <p className="text-slate-500">{a.when}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        <p className="text-sm text-slate-500">{copy.mvpNote}</p>

        {canOperate ? (
          <SoftListSlot pending={loading && assignments.length === 0}>
            <section
              className="kuteka-detail-panel flex flex-col gap-3 p-5"
              aria-label="Operação mínima do Agente"
            >
              <p className="kuteka-detail-eyebrow">Operação do dia</p>
              <Heading level={2}>Agenda → Relatórios</Heading>
              <Text className="text-sm text-slate-600">
                Missão: fechar visitas e follow-up nos imóveis atribuídos. Escalone bloqueios ao
                Supervisor.
              </Text>
              <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { href: '/app/agente#agenda', label: '1. Agenda' },
                  { href: '/app/agente#visitas', label: '2. Visitas' },
                  { href: '/app/agente#imoveis', label: '3. Imóveis atribuídos' },
                  { href: '/app/agente#clientes', label: '4. Clientes' },
                  { href: '/app/agente#tarefas', label: '5. Tarefas' },
                  { href: '/app/agente#followup', label: '6. Follow-up' },
                  { href: '/app/agente#relatorios', label: '7. Relatórios' },
                  { href: '/app/agente#notificacoes', label: '8. Notificações' },
                ].map((step) => (
                  <li key={step.href}>
                    <a
                      href={step.href}
                      className="block rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:border-brand-300"
                    >
                      {step.label}
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <section id="agenda" className="flex flex-col gap-2">
              <Heading level={2}>Agenda</Heading>
              <Text className="text-sm text-slate-600">
                Compromissos do dia com base nos imóveis atribuídos e visitas planeadas.
              </Text>
              <ul className="flex flex-col gap-2">
                {assignments.slice(0, 3).map((row) => (
                  <li
                    key={`agenda-${row.id}`}
                    className="rounded-kuteka border border-slate-200 bg-white px-4 py-3 text-sm"
                  >
                    <p className="font-medium text-slate-900">
                      Rever {row.property?.title ?? row.property_id}
                    </p>
                    <p className="text-slate-500">Prioridade: contacto / visita / follow-up</p>
                  </li>
                ))}
                {!loading && assignments.length === 0 ? (
                  <li className="text-sm text-slate-500">
                    Sem itens na agenda — explore inventário.
                  </li>
                ) : null}
              </ul>
            </section>

            <section id="visitas" className="flex flex-col gap-2">
              <Heading level={2}>Visitas</Heading>
              <Text className="text-sm text-slate-600">
                Abra o inventário habitacional ou o detalhe do imóvel atribuído para marcar /
                confirmar visitas.
              </Text>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/habitacao?vista=visitas"
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
                >
                  Vista de visitas
                </Link>
                <Link
                  href="/app/agente/explorar"
                  className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
                >
                  Inventário do Agente
                </Link>
              </div>
            </section>

            <section className="flex max-w-xl flex-col gap-4">
              <div>
                <Heading level={2}>{copy.preferencesTitle}</Heading>
                <Text className="mt-1 text-slate-600">{copy.preferencesHint}</Text>
              </div>
              {!loading ? (
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">{copy.fields.purpose}</span>
                    <select
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      className="rounded-kuteka border border-slate-200 bg-white px-3 py-2"
                    >
                      <option value="">{copy.fields.any}</option>
                      {PURPOSES.map((p) => (
                        <option key={p} value={p}>
                          {copy.purposes[p]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">{copy.fields.province}</span>
                    <input
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="rounded-kuteka border border-slate-200 bg-white px-3 py-2"
                      maxLength={80}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-slate-700">{copy.fields.city}</span>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="rounded-kuteka border border-slate-200 bg-white px-3 py-2"
                      maxLength={80}
                    />
                  </label>
                  {error ? (
                    <div
                      role="alert"
                      className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                    >
                      {error}
                    </div>
                  ) : null}
                  {message ? (
                    <div
                      role="status"
                      className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
                    >
                      {message}
                    </div>
                  ) : null}
                  <Button type="submit" disabled={saving} className="w-fit">
                    {saving ? copy.saving : copy.savePreferences}
                  </Button>
                </form>
              ) : null}
            </section>

            <section id="imoveis" className="flex flex-col gap-3">
              <Heading level={2}>{copy.assignmentsTitle}</Heading>
              {!loading && assignments.length === 0 ? (
                <EmptyState
                  title={copy.emptyAssignmentsTitle}
                  description={copy.emptyAssignments}
                  action={
                    <Link
                      href="/app/agente/explorar"
                      className={cn(buttonVariants({ variant: 'primary' }))}
                    >
                      {copy.emptyAssignmentsCta}
                    </Link>
                  }
                />
              ) : null}
              <ul className="flex flex-col gap-3">
                {assignments.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/app/agente/detalhe?id=${encodeURIComponent(row.property_id)}`}
                      className="flex items-center justify-between gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-3 hover:border-brand-300"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {row.property?.title ?? row.property_id}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {row.property?.code ?? ''}
                        </p>
                      </div>
                      <Badge variant="success">
                        {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section id="clientes" className="kuteka-detail-panel flex flex-col gap-2 p-5">
              <Heading level={2}>Clientes</Heading>
              <Text className="text-sm text-slate-600">
                Acompanhe interessados e mensagens. Contacte o Cliente antes de escalar.
              </Text>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/app/mensagens"
                  className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
                >
                  Mensagens
                </Link>
                <Link
                  href="/app/contratos"
                  className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
                >
                  Propostas / contratos
                </Link>
              </div>
            </section>

            <section id="tarefas" className="kuteka-detail-panel flex flex-col gap-2 p-5">
              <Heading level={2}>Tarefas</Heading>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                <li>Confirmar visitas do dia</li>
                <li>Actualizar estado dos imóveis atribuídos</li>
                <li>Registar follow-up pós-visita</li>
                <li>Escalar bloqueios ao Supervisor (não ao Founder)</li>
              </ul>
            </section>

            <section id="followup" className="kuteka-detail-panel flex flex-col gap-2 p-5">
              <Heading level={2}>Follow-up</Heading>
              <Text className="text-sm text-slate-600">
                Depois de cada visita: mensagem ao Cliente, nota ao Parceiro se necessário, e
                actualização do pipeline.
              </Text>
              <Link
                href="/app/mensagens"
                className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'w-fit')}
              >
                Abrir follow-up em Mensagens
              </Link>
            </section>

            <section id="relatorios" className="kuteka-detail-panel flex flex-col gap-2 p-5">
              <Heading level={2}>Relatórios</Heading>
              <Text className="text-sm text-slate-600">
                Resumo mínimo: {assignments.length} imóvel(is) atribuído(s). Relatórios avançados
                entram após validação Beta.
              </Text>
            </section>

            <section id="notificacoes" className="kuteka-detail-panel flex flex-col gap-2 p-5">
              <Heading level={2}>Notificações</Heading>
              <Text className="text-sm text-slate-600">
                Use o sino do shell para visitas, clientes e tarefas do papel Agente.
              </Text>
            </section>
          </SoftListSlot>
        ) : null}

        <FlowNextSteps
          title={copy.nextSteps.title}
          steps={[
            {
              href: '/app/habitacao/explorar',
              label: copy.nextSteps.viewActiveProperties,
              primary: true,
            },
            { href: '/app/confianca', label: copy.nextSteps.verifyAccount },
            ...(isAdmin
              ? [{ href: '/app/admin', label: copy.nextSteps.administration }]
              : [{ href: '/contacto', label: copy.nextSteps.contactKuteka }]),
          ]}
        />
      </div>
    </SessionStatusGate>
  );
}
