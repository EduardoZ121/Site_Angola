'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getAdministracaoCopy } from '../content';
import { assignCertifiedAgent, fetchPlatformStats, listAdminUsers, type AdminUserRow } from '../services/admin-client';
import { listMyAssignments, listOpenPropertyInterestLeads, type AgentAssignmentRow, type PropertyInterestLeadRow } from '@/modules/agente/services/agent-client';

export function AdminUsersClient() {
  const { locale } = useLocale();
  const copy = getAdministracaoCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const allowed = sessionStatus === 'ready' && !!session?.permissions.includes('admin.panel');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !allowed;

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [platformUsers, setPlatformUsers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [agentWork, setAgentWork] = useState<AgentAssignmentRow[]>([]);
  const [agentLeads, setAgentLeads] = useState<PropertyInterestLeadRow[]>([]);
  const [workNote, setWorkNote] = useState<string | null>(null);

  useEffect(() => {
    try {
      const papel = new URLSearchParams(window.location.search).get('papel');
      if (papel) setRole(papel);
    } catch {
      /* ignore */
    }
  }, []);

  async function reload() {
    const result = await listAdminUsers();
    if (!result.ok) {
      setError(result.message);
      setRows([]);
      return;
    }
    setError(null);
    setRows(result.data);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!allowed) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await listAdminUsers();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        setRows([]);
      } else {
        setError(null);
        setRows(result.data);
      }
      setLoading(false);
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [allowed, sessionStatus]);

  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    void fetchPlatformStats().then((result) => {
      if (!cancelled && result.ok) setPlatformUsers(result.data.profiles);
    });
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  async function onAssign(userId: string) {
    setBusyId(userId);
    setMessage(null);
    setError(null);
    const result = await assignCertifiedAgent({ userId });
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.already ? copy.alreadyAgent : copy.assigned);
    await reload();
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (role && !row.roles.includes(role)) return false;
      if (!q) return true;
      const name = (row.display_name ?? '').toLowerCase();
      return name.includes(q) || row.id.toLowerCase().includes(q);
    });
  }, [query, role, rows]);
  const openRow = shown.find((row) => row.id === openId) ?? rows.find((row) => row.id === openId) ?? null;
  const openAgentId = openRow?.roles.includes('certified_agent') ? openRow.id : null;

  useEffect(() => {
    if (!openAgentId) {
      setAgentWork([]);
      setAgentLeads([]);
      setWorkNote(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [work, leads] = await Promise.all([listMyAssignments(), listOpenPropertyInterestLeads()]);
      if (cancelled) return;
      if (!work.ok) {
        setAgentWork([]);
        setWorkNote(work.message);
      } else {
        setAgentWork(work.data.filter((row) => row.agent_id === openAgentId));
        setWorkNote(null);
      }
      setAgentLeads(leads.ok ? leads.data.filter((row) => row.assigned_agent_id === openAgentId) : []);
    })();
    return () => {
      cancelled = true;
    };
  }, [openAgentId]);

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
              Operação
            </p>
            <Heading level={1}>{copy.usersTitle}</Heading>
            <Text className="text-slate-600">{copy.usersHint}</Text>
            {allowed ? (
              <p className="text-sm font-medium text-slate-800">
                {platformUsers != null
                  ? `${platformUsers} pessoas reais na plataforma.`
                  : 'A contar as pessoas reais…'}
                {rows.length > 0
                  ? ` Esta lista mostra ${shown.length} de ${rows.length} carregadas (últimas 100).`
                  : ''}
              </p>
            ) : null}
          </div>
          {allowed ? (
            <Link
              href="/app/confianca/revisao"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
            >
              Rever Confiança
            </Link>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            {copy.forbidden}
          </div>
        ) : null}

        {allowed ? (
          <SoftListSlot pending={loading && rows.length === 0}>
            {message ? (
              <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {error}
              </div>
            ) : null}

            {!loading && rows.length === 0 ? (
              <EmptyState title={copy.emptyUsersTitle} description={copy.emptyUsers} />
            ) : null}

            {rows.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Procurar nome ou identificador"
                    aria-label="Procurar pessoa"
                    className="kuteka-ops-input w-full"
                  />
                  <select
                    value={role}
                    aria-label="Filtrar por papel"
                    onChange={(event) => setRole(event.target.value)}
                    className="kuteka-ops-input sm:max-w-xs"
                  >
                    <option value="">Todos os papéis</option>
                    <option value="client">Cliente</option>
                    <option value="patrimonial_partner">Parceiro</option>
                    <option value="certified_agent">Agente</option>
                    <option value="service_provider">Prestador</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="administrator">Administrador</option>
                    <option value="accountant">Contabilista</option>
                  </select>
                </div>
                {shown.length === 0 ? (
                  <EmptyState title="Nenhuma pessoa neste filtro" description="Mude a pesquisa ou o papel." />
                ) : null}
                {openRow ? (
                  <section className="kuteka-detail-panel flex flex-col gap-3 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Perfil operacional</p>
                    <h2 className="text-base font-semibold text-slate-900">
                      {openRow.display_name || 'Utilizador sem nome'}
                    </h2>
                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase text-slate-500">Identificador</dt>
                        <dd className="break-all font-mono text-xs">{openRow.id}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-500">Entrada</dt>
                        <dd>{new Date(openRow.created_at).toLocaleDateString('pt-PT')}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-500">Papéis</dt>
                        <dd>{openRow.roles.join(', ') || 'Sem papel'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase text-slate-500">Estado</dt>
                        <dd>Conta presente na lista operacional</dd>
                      </div>
                    </dl>
                    <p className="text-sm text-slate-600">
                      Zona, sanções e tempo de resposta só aparecem quando houver registo. Esta ficha não inventa esses números e não muda papéis sensíveis.
                    </p>
                    {openRow.roles.includes('certified_agent') ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Imóveis atribuídos ({agentWork.length})</p>
                          {workNote ? <p className="text-sm text-amber-800">{workNote}</p> : null}
                          {agentWork.length === 0 && !workNote ? (
                            <p className="text-sm text-slate-600">Nenhum acompanhamento visível para esta pessoa.</p>
                          ) : (
                            <ul className="mt-2 flex flex-col gap-2">
                              {agentWork.map((item) => (
                                <li key={item.id}>
                                  <Link href={`/app/agente/detalhe?id=${encodeURIComponent(item.property_id)}`} className="text-sm font-semibold text-brand-700 underline">
                                    {item.property?.title ?? item.property_id}
                                  </Link>
                                  <p className="text-xs text-slate-500">{item.status} · {new Date(item.created_at).toLocaleDateString('pt-PT')}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Interesses atribuídos ({agentLeads.length})</p>
                          {agentLeads.length === 0 ? (
                            <p className="text-sm text-slate-600">Sem interesses atribuídos visíveis.</p>
                          ) : (
                            <ul className="mt-2 flex flex-col gap-2">
                              {agentLeads.map((item) => (
                                <li key={item.id}>
                                  <Link href={`/app/habitacao/detalhe?id=${encodeURIComponent(item.property_id)}`} className="text-sm font-semibold text-brand-700 underline">
                                    {item.property?.title ?? item.property_id}
                                  </Link>
                                  <p className="text-xs text-slate-500">{item.status}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Link href="/app/contratos" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                        Contratos
                      </Link>
                      <Link href="/app/confianca/revisao" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                        Confiança
                      </Link>
                      <Link href="/app/mensagens" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                        Mensagens
                      </Link>
                      {openRow.roles.includes('certified_agent') ? (
                        <Link href="/app/agente" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                          Trabalho do agente
                        </Link>
                      ) : null}
                      <Link href="/app/fundador?tab=pessoas" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
                        Papéis institucionais
                      </Link>
                    </div>
                  </section>
                ) : null}
              <ul className="flex flex-col gap-3">
                {shown.map((row) => {
                  const isAgent = row.roles.includes('certified_agent');
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <button type="button" className="min-w-0 text-left" onClick={() => setOpenId(row.id)}>
                        <p className="font-medium text-slate-900">
                          {row.display_name || 'Utilizador sem nome'}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">{row.id}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {row.roles.length > 0 ? (
                            row.roles.map((code) => (
                              <Badge key={code} variant="brand">
                                {copy.roleLabels[code as keyof typeof copy.roleLabels] ?? code}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-slate-500">Sem papéis</span>
                          )}
                        </div>
                      </button>
                      <Button
                        type="button"
                        disabled={isAgent || busyId === row.id}
                        onClick={() => void onAssign(row.id)}
                        className="w-fit shrink-0"
                      >
                        {busyId === row.id
                          ? copy.assigning
                          : isAgent
                            ? copy.alreadyAgent
                            : copy.assignAgent}
                      </Button>
                    </li>
                  );
                })}
              </ul>
              </div>
            ) : null}
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
