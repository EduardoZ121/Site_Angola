'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getAgenteCopy } from '../content/pt';
import {
  getAgentPreferences,
  listMyAssignments,
  saveAgentPreferences,
  type AgentAssignmentRow,
} from '../services/agent-client';

const PURPOSES = ['rent', 'sale', 'both'] as const;

export function AgentHubClient() {
  const copy = getAgenteCopy();
  const { session, status: sessionStatus } = useAppSession();
  const canOperate = session?.permissions.includes('agent.operate') ?? false;

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">
            Representação Kuteka
          </p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="text-slate-600">{copy.subtitle}</Text>
        </div>
        {canOperate ? (
          <Link
            href="/app/agente/explorar"
            className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
          >
            {copy.explore}
          </Link>
        ) : null}
      </header>

      {!canOperate && sessionStatus === 'ready' ? (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.needAgent}
        </div>
      ) : null}

      <p className="text-sm text-slate-500">{copy.mvpNote}</p>

      {canOperate ? (
        <>
          <section className="flex max-w-xl flex-col gap-4">
            <div>
              <Heading level={2}>{copy.preferencesTitle}</Heading>
              <Text className="mt-1 text-slate-600">{copy.preferencesHint}</Text>
            </div>
            {loading ? <ModuleSkeleton rows={2} /> : null}
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
                  <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    {error}
                  </div>
                ) : null}
                {message ? (
                  <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                    {message}
                  </div>
                ) : null}
                <Button type="submit" disabled={saving} className="w-fit">
                  {saving ? copy.saving : copy.savePreferences}
                </Button>
              </form>
            ) : null}
          </section>

          <section className="flex flex-col gap-3">
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
                      <p className="font-mono text-xs text-slate-500">{row.property?.code ?? ''}</p>
                    </div>
                    <Badge variant="success">
                      {copy.statuses[row.status as keyof typeof copy.statuses] ?? row.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
