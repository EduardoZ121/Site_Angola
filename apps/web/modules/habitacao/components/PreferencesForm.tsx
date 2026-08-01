'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getHabitacaoCopy } from '../content/pt';
import { getClientPreferences, saveClientPreferences } from '../services/housing-client';

const PURPOSES = ['rent', 'sale', 'both'] as const;

export function PreferencesForm() {
  const copy = getHabitacaoCopy();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canExplore =
    sessionStatus === 'ready' && !!session?.permissions.includes('housing.explore');
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canExplore;

  const [purpose, setPurpose] = useState<string>('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canExplore) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await getClientPreferences();
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
      } else if (result.data) {
        setPurpose(result.data.purpose ?? '');
        setProvince(result.data.province ?? '');
        setCity(result.data.city ?? '');
        setError(null);
      }
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
  }, [canExplore, sessionStatus]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    const result = await saveClientPreferences({
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
          {canExplore ? (
            <Link
              href="/app/habitacao/explorar"
              className={cn(buttonVariants({ variant: 'primary' }), 'w-fit shrink-0')}
            >
              {copy.explore}
            </Link>
          ) : null}
        </header>

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? (
          <ForbiddenPanel
            message={copy.needClient}
            primaryHref="/auth/onboarding/papeis"
            primaryLabel={copy.activateRole}
          />
        ) : null}

        {canExplore ? (
          <>
            <p className="text-sm text-slate-500">{copy.mvpNote}</p>

            <section className="flex max-w-xl flex-col gap-4">
              <div>
                <Heading level={2}>{copy.preferencesTitle}</Heading>
                <Text className="mt-1 text-slate-600">{copy.preferencesHint}</Text>
              </div>

              <SoftListSlot pending={loading}>
                {!loading ? (
                  <form onSubmit={onSubmit} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-slate-700">{copy.fields.purpose}</span>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-slate-900"
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
                        className="rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-slate-900"
                        maxLength={80}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium text-slate-700">{copy.fields.city}</span>
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-slate-900"
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
              </SoftListSlot>
            </section>

            <FlowNextSteps
              title="Continuar para o inventário"
              steps={[
                { href: '/app/habitacao/explorar', label: copy.explore, primary: true },
                { href: '/app/confianca', label: 'Verificar conta' },
                { href: '/app/agente', label: 'Área do Agente' },
              ]}
            />
          </>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
