'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Button, Heading, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { formatAoa } from '@/lib/format/aoa';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { inventoryBadge } from '@/modules/kocc/lib/public-label';
import { PropertyShowcase } from '@/modules/listings/components/PropertyShowcase';
import {
  listPropertyMedia,
  type PropertyMediaRow,
} from '@/modules/patrimonios/services/property-media-client';
import { EmptyState } from '@/modules/shell/components/EmptyState';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { NotifyAvailabilityButton } from '@/modules/ops/components/NotifyAvailabilityButton';
import { getHabitacaoCopy } from '../content';
import {
  expressInterest,
  getActiveProperty,
  listMyInterests,
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

  const [row, setRow] = useState<HousingPropertyRow | null>(null);
  const [media, setMedia] = useState<PropertyMediaRow[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasInterest, setHasInterest] = useState(false);

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
        setError(prop.message);
        setRow(null);
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
    const result = await expressInterest({ propertyId: id });
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
              {inventoryBadge(row.is_demo) ? (
                <Badge variant="default">{inventoryBadge(row.is_demo)}</Badge>
              ) : null}
            </div>
          ) : null}
        </header>

        <SoftListSlot pending={loading && !row}>
          {error && !row ? (
            <>
              <EmptyState
                title={copy.loadError}
                description={error ?? 'Este anúncio pode já não estar activo.'}
                action={
                  <Link
                    href="/app/habitacao/explorar"
                    className={cn(buttonVariants({ variant: 'primary' }))}
                  >
                    Explorar habitação
                  </Link>
                }
              />
              <FlowNextSteps
                steps={[
                  { href: '/app/habitacao/explorar', label: 'Explorar inventário', primary: true },
                  { href: '/app/confianca', label: 'Verificar conta' },
                ]}
              />
            </>
          ) : null}

          {row ? (
            <>
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
                <div className="flex flex-wrap gap-3">
                  {canExplore ? (
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
                      Preparar contrato
                    </Link>
                  ) : null}
                  <Link href="/app/agente" className={cn(buttonVariants({ variant: 'secondary' }))}>
                    {copy.goAgent}
                  </Link>
                </div>
                {canExplore ? <NotifyAvailabilityButton propertyId={id} /> : null}
              </div>

              <FlowNextSteps
                title="Continuar o percurso"
                steps={[
                  { href: '/app/agente', label: 'Agente acompanha', primary: true },
                  ...(canContracts ? [{ href: '/app/contratos', label: 'Preparar contrato' }] : []),
                  { href: '/app/confianca', label: 'Confiança verifica' },
                  { href: '/app/habitacao/explorar', label: 'Mais patrimónios' },
                ]}
              />
            </>
          ) : null}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
