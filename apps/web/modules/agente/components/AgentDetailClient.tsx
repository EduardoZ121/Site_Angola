'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { ModuleSkeleton } from '@/modules/shell/components/ModuleSkeleton';
import { getAgenteCopy } from '../content/pt';
import {
  activateAssignment,
  getActiveProperty,
  getMyAssignmentForProperty,
  type AgentAssignmentRow,
  type AgentPropertyRow,
} from '../services/agent-client';

export function AgentDetailClient({ id }: { id: string }) {
  const copy = getAgenteCopy();
  const { session, status: sessionStatus } = useAppSession();
  const canOperate = session?.permissions.includes('agent.operate') ?? false;
  const [row, setRow] = useState<AgentPropertyRow | null>(null);
  const [assignment, setAssignment] = useState<AgentAssignmentRow | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [property, mine] = await Promise.all([
        getActiveProperty(id),
        canOperate
          ? getMyAssignmentForProperty(id)
          : Promise.resolve({ ok: true as const, data: null }),
      ]);
      if (cancelled) return;
      if (!property.ok) {
        setError(property.message);
        setRow(null);
      } else {
        setError(null);
        setRow(property.data);
      }
      if (mine.ok) setAssignment(mine.data);
      setLoading(false);
    }
    if (sessionStatus === 'ready') void load();
    return () => {
      cancelled = true;
    };
  }, [id, canOperate, sessionStatus]);

  async function onActivate() {
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await activateAssignment({ propertyId: id, notes });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.activated);
    const mine = await getMyAssignmentForProperty(id);
    if (mine.ok) setAssignment(mine.data);
  }

  if (loading) return <ModuleSkeleton rows={4} />;

  if (error && !row) {
    return (
      <div className="flex flex-col gap-6">
        <Heading level={1}>{copy.detailTitle}</Heading>
        <div
          role="alert"
          className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {error}
        </div>
        <div className="kuteka-glass flex flex-wrap gap-3 p-4">
          <Link
            href="/app/agente/explorar"
            className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
          >
            Continuar exploração
          </Link>
          <Link
            href="/app/agente"
            className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
          >
            Área Agente
          </Link>
        </div>
      </div>
    );
  }

  if (!row) return null;

  const alreadyActive = assignment?.status === 'active';

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading level={1}>{row.title}</Heading>
          <p className="font-mono text-sm text-slate-500">{row.code}</p>
        </div>
        <Badge variant="success">Activo</Badge>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.type}
          </dt>
          <dd className="mt-1 text-slate-900">
            {copy.types[row.property_type as keyof typeof copy.types] ?? row.property_type}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.purpose}
          </dt>
          <dd className="mt-1 text-slate-900">
            {copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.province}
          </dt>
          <dd className="mt-1 text-slate-900">{row.province || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.city}
          </dt>
          <dd className="mt-1 text-slate-900">{row.city || '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {copy.fields.address}
          </dt>
          <dd className="mt-1 text-slate-900">{row.address_line || '—'}</dd>
        </div>
      </dl>

      {canOperate ? (
        <section className="flex max-w-xl flex-col gap-3 rounded-kuteka border border-slate-200 bg-white px-4 py-4">
          {alreadyActive ? (
            <Badge variant="success">{copy.statuses.active}</Badge>
          ) : (
            <>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700">{copy.fields.notes}</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="rounded-kuteka border border-slate-200 px-3 py-2"
                />
              </label>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void onActivate()}
                className="w-fit"
              >
                {saving ? copy.activating : copy.activate}
              </Button>
            </>
          )}
          {error ? (
            <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-kuteka border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
              {message}
            </div>
          ) : null}
        </section>
      ) : (
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.needAgent}
        </div>
      )}

      <div className="kuteka-glass flex flex-wrap gap-3 p-4">
        <Link
          href="/app/agente/explorar"
          className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
        >
          Continuar exploração
        </Link>
        <Link
          href="/app/confianca"
          className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}
        >
          Confiança
        </Link>
        <Link href="/contacto" className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}>
          Contactar Kuteka
        </Link>
      </div>
    </div>
  );
}
