'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { ExperiencePulse } from '@/modules/kocc/components/ExperiencePulse';
import { PropertyShowcase } from '@/modules/listings/components/PropertyShowcase';
import { MessagePropertyOwnerButton } from '@/modules/mensagens/components/MessagePropertyOwnerButton';
import {
  listPropertyMedia,
  type PropertyMediaRow,
} from '@/modules/patrimonios/services/property-media-client';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { NotifyAvailabilityButton } from '@/modules/ops/components/NotifyAvailabilityButton';
import { availabilityLabel } from '../lib/visit-request';
import { showcaseById } from '../lib/demo-showcase';
import { getHabitacaoCopy } from '../content';
import {
  expressInterest,
  getActiveProperty,
  listMyInterests,
  shouldOfferAvailabilityNotify,
  type HousingPropertyRow,
} from '../services/housing-client';

export function HousingDetailClient({ id }: { id: string }) {
  const { locale } = useLocale();
  const copy = getHabitacaoCopy(locale);
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canExplore =
    sessionStatus === 'ready' && !!session?.permissions.includes('housing.explore');
  const canContracts =
    sessionStatus === 'ready' && !!session?.permissions.includes('contracts.manage');
  const canAgent = sessionStatus === 'ready' && !!session?.permissions.includes('agent.operate');

  const [row, setRow] = useState<HousingPropertyRow | null>(null);
  const [media, setMedia] = useState<PropertyMediaRow[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasInterest, setHasInterest] = useState(false);
  const [visitOn, setVisitOn] = useState('');
  const [visitWindow, setVisitWindow] = useState('qualquer');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [prop, photos, interests] = await Promise.all([
        getActiveProperty(id),
        listPropertyMedia(id),
        canExplore ? listMyInterests() : Promise.resolve({ ok: true as const, data: [] }),
      ]);
      if (cancelled) return;
      if (!prop.ok) {
        const demo = showcaseById(id);
        if (demo) {
          setError(null);
          setRow(demo);
          setActiveUrl(demo.cover_image_url);
        } else {
          setError(prop.message);
          setRow(null);
        }
      } else {
        setError(null);
        setRow(prop.data);
        setActiveUrl(prop.data.cover_image_url);
      }
      if (photos.ok) {
        setMedia(photos.data);
        const primary = photos.data.find((m) => m.is_primary) ?? photos.data[0];
        if (primary) setActiveUrl(primary.public_url);
      }
      if (interests.ok) {
        setHasInterest(interests.data.some((i) => i.property_id === id));
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
  }, [id, canExplore, sessionStatus]);

  async function onInterest() {
    setBusy(true);
    setMessage(null);
    setError(null);
    const result = await expressInterest({ propertyId: id, visitOn, visitWindow });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setHasInterest(true);
    setMessage(copy.interestDone);
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{row?.title ?? copy.detailTitle}</Heading>
            {row ? (
              <>
                <p className="font-mono text-sm text-stone-600">{row.code}</p>
                <p className="kuteka-detail-price">{formatAoa(row.price_aoa, row.purpose)}</p>
              </>
            ) : null}
          </div>
          {row ? (
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Activo</Badge>
              {row.is_demo ? <Badge variant="warning">Demo</Badge> : null}
            </div>
          ) : null}
        </header>

        <SoftListSlot pending={loading && !row}>
          {error && !row ? (
            <>
              <EmptyState
                title={copy.loadError}
                description={error ?? copy.detail.inactiveHint}
                action={
                  <Link
                    href="/app/habitacao/explorar"
                    className={cn(buttonVariants({ variant: 'primary' }))}
                  >
                    {copy.exploreTitle}
                  </Link>
                }
              />
              <FlowNextSteps
                steps={[
                  {
                    href: '/app/habitacao/explorar',
                    label: copy.detail.stepExplore,
                    primary: true,
                  },
                  { href: '/app/confianca', label: copy.goTrust },
                ]}
              />
            </>
          ) : null}

          {row ? (
            <>
              {availabilityLabel(row) ? (
                <p className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  {availabilityLabel(row)}. Ainda não está livre para entrada. Pode pedir aviso quando abrir.
                </p>
              ) : null}
              <PropertyShowcase
                row={row}
                media={media}
                activeUrl={activeUrl}
                onSelectMedia={setActiveUrl}
                typeLabel={
                  copy.types[row.property_type as keyof typeof copy.types] ?? row.property_type
                }
                purposeLabel={
                  copy.purposes[row.purpose as keyof typeof copy.purposes] ?? row.purpose
                }
              />

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

              <div className="kuteka-detail-panel flex flex-col gap-3 p-4">
                {canExplore && !row.is_demo && !hasInterest ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm text-slate-800">
                      Data preferida para visita
                      <input
                        type="date"
                        value={visitOn}
                        onChange={(event) => setVisitOn(event.target.value)}
                        className="rounded-kuteka border border-slate-300 bg-white px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-800">
                      Altura do dia
                      <select
                        value={visitWindow}
                        onChange={(event) => setVisitWindow(event.target.value)}
                        className="rounded-kuteka border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="qualquer">Qualquer hora</option>
                        <option value="manha">Manhã</option>
                        <option value="tarde">Tarde</option>
                      </select>
                    </label>
                    <p className="text-xs text-slate-600 sm:col-span-2">
                      A data é um pedido, não uma marcação confirmada. O agente vê o pedido. Não há calendário separado.
                    </p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-3">
                  {canExplore && !row.is_demo ? (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={busy || hasInterest}
                      onClick={() => void onInterest()}
                    >
                      {busy ? copy.interestBusy : hasInterest ? copy.interestDone : copy.interest}
                    </Button>
                  ) : null}
                  <Link
                    href="/app/confianca"
                    className={cn(buttonVariants({ variant: 'secondary' }))}
                  >
                    {copy.goTrust}
                  </Link>
                  {canContracts ? (
                    <Link
                      href="/app/contratos"
                      className={cn(buttonVariants({ variant: 'secondary' }))}
                    >
                      {copy.detail.prepareContract}
                    </Link>
                  ) : null}
                  {canAgent ? (
                    <Link
                      href="/app/agente"
                      className={cn(buttonVariants({ variant: 'secondary' }))}
                    >
                      {copy.goAgent}
                    </Link>
                  ) : null}
                </div>
                {canExplore && row && shouldOfferAvailabilityNotify(row) ? (
                  <NotifyAvailabilityButton propertyId={id} />
                ) : null}
                <MessagePropertyOwnerButton
                  propertyId={id}
                  ownerId={row.owner_id}
                  propertyTitle={row.title}
                />
              </div>

              <ExperiencePulse pagePath="/app/habitacao/detalhe" context={{ propertyId: id }} />
              <FlowNextSteps
                title={copy.detail.nextTitle}
                steps={[
                  ...(canAgent
                    ? [{ href: '/app/agente', label: copy.detail.stepAgent, primary: true }]
                    : []),
                  ...(canContracts
                    ? [{ href: '/app/contratos', label: copy.detail.stepContract }]
                    : []),
                  { href: '/app/confianca', label: copy.detail.stepTrust },
                  { href: '/app/habitacao/explorar', label: copy.detail.stepMore },
                ]}
              />
            </>
          ) : null}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
