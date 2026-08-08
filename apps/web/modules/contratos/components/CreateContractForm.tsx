'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { IdentityPartySnapshot } from '@kuteka/types';
import { CONTRACT_PURPOSES } from '@kuteka/validation';
import { Button, Heading, Input, Label, Text, Textarea, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { KisGateBanner } from '@/modules/identidade/components/KisGateBanner';
import { KisPartyReadonly } from '@/modules/identidade/components/KisPartyReadonly';
import { getMyKycLevel, getMyPartySnapshot } from '@/modules/identidade/services/identity-client';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { ForbiddenPanel } from '@/modules/shell/components/ForbiddenPanel';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getContratosCopy } from '../content';
import {
  createPropertyContract,
  listContractProperties,
  type ContractPropertyOption,
} from '../services/contracts-client';

export function CreateContractForm() {
  const { locale } = useLocale();
  const copy = getContratosCopy(locale);
  const router = useRouter();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const canManage =
    sessionStatus === 'ready' && !!session?.permissions.includes('contracts.manage');
  const canCreate =
    sessionStatus === 'ready' &&
    (!!session?.permissions.includes('properties.manage') ||
      !!session?.permissions.includes('admin.panel'));
  const accessPending = sessionStatus === 'loading';
  const denied = sessionStatus === 'ready' && !canManage;
  const deniedCreate = sessionStatus === 'ready' && canManage && !canCreate;

  const [properties, setProperties] = useState<ContractPropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [clientId, setClientId] = useState('');
  const [agentId, setAgentId] = useState('');
  const [interestId, setInterestId] = useState('');
  const [purpose, setPurpose] = useState<(typeof CONTRACT_PURPOSES)[number]>('rent');
  const [amountAoa, setAmountAoa] = useState('');
  const [title, setTitle] = useState('');
  const [termsNotes, setTermsNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycLevel, setKycLevel] = useState(0);
  const [partySnapshot, setPartySnapshot] = useState<IdentityPartySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!canCreate) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const [result, kyc, snap] = await Promise.all([
        listContractProperties(),
        getMyKycLevel(),
        getMyPartySnapshot(),
      ]);
      if (cancelled) return;
      if (kyc.ok) setKycLevel(kyc.level);
      if (snap.ok) setPartySnapshot(snap.data);
      if (!result.ok) {
        setError(result.message);
        setProperties([]);
      } else {
        setError(null);
        setProperties(result.data);
        const first = result.data[0];
        if (first) {
          setPropertyId(first.id);
          setPurpose(first.purpose === 'sale' ? 'sale' : 'rent');
          setAmountAoa(first.price_aoa != null ? String(Math.round(first.price_aoa)) : '');
          setTitle(
            `Contrato de ${first.purpose === 'sale' ? 'compra' : 'arrendamento'} — ${first.title}`,
          );
        }
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
  }, [canCreate, sessionStatus]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === propertyId) ?? null,
    [properties, propertyId],
  );

  function onPropertyChange(nextId: string) {
    setPropertyId(nextId);
    const property = properties.find((item) => item.id === nextId);
    if (!property) return;
    const nextPurpose = property.purpose === 'sale' ? 'sale' : 'rent';
    setPurpose(nextPurpose);
    setAmountAoa(property.price_aoa != null ? String(Math.round(property.price_aoa)) : '');
    setTitle(
      `Contrato de ${nextPurpose === 'sale' ? 'compra' : 'arrendamento'} — ${property.title}`,
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const amount = amountAoa.trim() ? Number(amountAoa.replace(/\s/g, '')) : Number.NaN;
    const result = await createPropertyContract({
      propertyId,
      clientId,
      agentId: agentId.trim() || null,
      interestId: interestId.trim() || null,
      purpose,
      amountAoa: amount,
      title,
      termsNotes: termsNotes.trim() || null,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/app/contratos/detalhe?id=${encodeURIComponent(result.id)}`);
  }

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-8">
        <header className="kuteka-glass flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Heading level={1}>{copy.createTitle}</Heading>
            <Text className="text-slate-600">{copy.createHint}</Text>
          </div>
          {canCreate ? (
            <Link
              href="/app/contratos"
              className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit shrink-0')}
            >
              Ver contratos
            </Link>
          ) : null}
        </header>

        {canCreate ? (
          <div className="flex flex-col gap-3">
            <KisGateBanner level={kycLevel} action="contract" minLevel={2} />
            <KisPartyReadonly snapshot={partySnapshot} title="A sua identidade (KIS)" />
          </div>
        ) : null}

        {accessPending ? <SoftListSlot pending /> : null}
        {denied ? <ForbiddenPanel message={copy.forbidden} /> : null}
        {deniedCreate ? (
          <ForbiddenPanel
            message="Para preparar contratos precisa de ser Parceiro Patrimonial ou Administrador."
            primaryHref="/auth/onboarding/papeis"
            primaryLabel="Activar papel"
            steps={[
              { href: '/app/confianca', label: 'Confiança', primary: true },
              { href: '/app/contratos', label: 'Ver contratos' },
              { href: '/app', label: 'Painel' },
            ]}
          />
        ) : null}

        {canCreate ? (
          <SoftListSlot pending={loading && properties.length === 0}>
            {error ? (
              <div
                role="alert"
                className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              >
                {error}
              </div>
            ) : null}

            {!loading && properties.length === 0 ? (
              <div className="rounded-kuteka border border-slate-200 bg-white px-4 py-4">
                <p className="font-medium text-slate-800">{copy.emptyActivePropertiesTitle}</p>
                <p className="mt-1 text-sm text-slate-500">{copy.emptyActivePropertiesHint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/app/patrimonios/novo"
                    className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
                  >
                    {copy.emptyActivePropertiesActivate}
                  </Link>
                  <Link
                    href="/app/habitacao/explorar"
                    className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                  >
                    {copy.emptyActivePropertiesViewInventory}
                  </Link>
                </div>
              </div>
            ) : null}

            {!loading && properties.length > 0 ? (
              <form onSubmit={onSubmit} className="kuteka-glass flex flex-col gap-6 p-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="property">{copy.fields.property}</Label>
                    <select
                      id="property"
                      value={propertyId}
                      onChange={(event) => onPropertyChange(event.target.value)}
                      className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                      required
                    >
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.code} — {property.title}
                        </option>
                      ))}
                    </select>
                    {selectedProperty ? (
                      <Text className="text-xs text-slate-500">
                        {selectedProperty.code} ·{' '}
                        {copy.purposes[selectedProperty.purpose as keyof typeof copy.purposes] ??
                          selectedProperty.purpose}
                      </Text>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="client">{copy.fields.clientId}</Label>
                    <Input
                      id="client"
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="agent">{copy.fields.agentId}</Label>
                    <Input
                      id="agent"
                      value={agentId}
                      onChange={(event) => setAgentId(event.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="purpose">{copy.fields.purpose}</Label>
                    <select
                      id="purpose"
                      value={purpose}
                      onChange={(event) =>
                        setPurpose(event.target.value as (typeof CONTRACT_PURPOSES)[number])
                      }
                      className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      {CONTRACT_PURPOSES.map((item) => (
                        <option key={item} value={item}>
                          {copy.purposes[item]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">{copy.fields.amount}</Label>
                    <Input
                      id="amount"
                      inputMode="numeric"
                      value={amountAoa}
                      onChange={(event) => setAmountAoa(event.target.value)}
                      placeholder="450000"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="title">{copy.fields.title}</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder={copy.fields.titlePlaceholder}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="interest">{copy.fields.interestId}</Label>
                    <Input
                      id="interest"
                      value={interestId}
                      onChange={(event) => setInterestId(event.target.value)}
                      placeholder="00000000-0000-0000-0000-000000000000"
                    />
                  </div>

                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="terms">{copy.fields.terms}</Label>
                    <Textarea
                      id="terms"
                      value={termsNotes}
                      onChange={(event) => setTermsNotes(event.target.value)}
                      rows={5}
                      placeholder={copy.fields.termsPlaceholder}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? copy.creating : copy.create}
                  </Button>
                  <Link
                    href="/app/contratos"
                    className={cn(buttonVariants({ variant: 'secondary' }))}
                  >
                    Ver contratos
                  </Link>
                </div>
              </form>
            ) : null}

            <FlowNextSteps
              title="Contrato no fluxo"
              steps={[
                { href: '/app/contratos', label: 'Ver contratos', primary: true },
                { href: '/app/confianca', label: 'Confirmar Confiança' },
                { href: '/app/admin', label: 'Administração' },
              ]}
            />
          </SoftListSlot>
        ) : null}
      </div>
    </SessionStatusGate>
  );
}
