'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Heading, Text, Input, Label, Textarea, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import {
  CONSERVATION_STATES,
  CONSTRUCTION_STATUSES,
  KUTEKA_SERVICES,
  MANAGEMENT_LEVELS,
  PROPERTY_PURPOSES,
  PROPERTY_TYPES,
  RENOVATION_REQUESTS,
  UNFINISHED_INTENTS,
  type ActivatePropertyInput,
  type KutekaService,
  type ManagementLevel,
} from '@kuteka/validation';
import { useAppSession } from '@/modules/authentication/components/app-session';
import {
  CONSERVATION_LABELS,
  CONSTRUCTION_LABELS,
  MANAGEMENT_LABELS,
  RENOVATION_LABELS,
  SERVICE_LABELS,
  UNFINISHED_LABELS,
} from '@/modules/listings/lib/manual-ops-labels';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { getPatrimoniosCopy } from '../content/pt';
import { activateProperty } from '../services/properties-client';
import type { LocalMediaDraft } from '../services/property-media-client';
import { PropertyMediaEditor } from './PropertyMediaEditor';

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function TriBool({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-sm font-medium text-slate-800">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {(
          [
            { v: true as const, t: 'Sim' },
            { v: false as const, t: 'Não' },
            { v: null, t: 'N/D' },
          ] as const
        ).map((opt) => (
          <button
            key={String(opt.v)}
            type="button"
            onClick={() => onChange(opt.v)}
            className={cn(
              'rounded-kuteka border px-3 py-1.5 text-xs font-medium',
              value === opt.v
                ? 'border-brand-600 bg-brand-50 text-brand-900'
                : 'border-slate-300 bg-white text-slate-700',
            )}
            aria-pressed={value === opt.v}
          >
            {opt.t}
          </button>
        ))}
      </div>
      <input type="hidden" id={id} value={value == null ? '' : value ? '1' : '0'} readOnly />
    </fieldset>
  );
}

export function ActivatePropertyForm() {
  const copy = getPatrimoniosCopy();
  const router = useRouter();
  const { session, status } = useAppSession();
  const canManage = session?.permissions.includes('properties.manage') ?? false;

  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<(typeof PROPERTY_TYPES)[number]>('apartment');
  const [purpose, setPurpose] = useState<(typeof PROPERTY_PURPOSES)[number]>('rent');
  const [managementLevel, setManagementLevel] = useState<ManagementLevel>('announce_only');
  const [requestedServices, setRequestedServices] = useState<KutekaService[]>(['announce']);
  const [renovationRequests, setRenovationRequests] = useState<
    NonNullable<ActivatePropertyInput['renovationRequests']>
  >([]);
  const [constructionStatus, setConstructionStatus] =
    useState<(typeof CONSTRUCTION_STATUSES)[number]>('complete');
  const [unfinishedIntent, setUnfinishedIntent] =
    useState<(typeof UNFINISHED_INTENTS)[number]>('none');
  const [conservationState, setConservationState] =
    useState<(typeof CONSERVATION_STATES)[number]>('good');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [commune, setCommune] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');
  const [priceAoa, setPriceAoa] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaTotal, setAreaTotal] = useState('');
  const [areaUseful, setAreaUseful] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [hasPipedWater, setHasPipedWater] = useState<boolean | null>(null);
  const [hasElectricity, setHasElectricity] = useState<boolean | null>(null);
  const [hasGenerator, setHasGenerator] = useState<boolean | null>(null);
  const [hasInternet, setHasInternet] = useState<boolean | null>(null);
  const [hasSecurity, setHasSecurity] = useState<boolean | null>(null);
  const [hasPavedStreet, setHasPavedStreet] = useState<boolean | null>(null);
  const [nearSchools, setNearSchools] = useState<boolean | null>(null);
  const [nearHospitals, setNearHospitals] = useState<boolean | null>(null);
  const [nearMarkets, setNearMarkets] = useState<boolean | null>(null);
  const [nearTransport, setNearTransport] = useState<boolean | null>(null);
  const [media, setMedia] = useState<LocalMediaDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'ready' && !canManage) {
    return (
      <div className="flex flex-col gap-4">
        <Heading level={1}>{copy.activate}</Heading>
        <div className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {copy.needPartner}
        </div>
        <Link
          href="/auth/onboarding/papeis"
          className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}
        >
          {copy.activateRole}
        </Link>
      </div>
    );
  }

  function parseNum(raw: string): number | null {
    if (!raw.trim()) return null;
    const n = Number(raw.replace(/\s/g, '').replace(',', '.'));
    return Number.isNaN(n) ? null : n;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await activateProperty(
      {
        title,
        propertyType,
        purpose,
        managementLevel,
        requestedServices,
        renovationRequests,
        unfinishedIntent,
        constructionStatus,
        conservationState,
        province,
        municipality,
        commune,
        city,
        neighborhood,
        addressLine,
        streetNumber,
        notes,
        priceAoa: parseNum(priceAoa),
        bedrooms: parseNum(bedrooms),
        bathrooms: parseNum(bathrooms),
        areaTotalM2: parseNum(areaTotal),
        areaUsefulM2: parseNum(areaUseful),
        yearBuilt: parseNum(yearBuilt),
        latitude: parseNum(latitude),
        longitude: parseNum(longitude),
        hasPipedWater,
        hasElectricity,
        hasGenerator,
        hasInternet,
        hasSecurity,
        hasPavedStreet,
        nearSchools,
        nearHospitals,
        nearMarkets,
        nearTransport,
      },
      media,
    );
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/app/patrimonios/detalhe?id=${result.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="kuteka-glass flex flex-col gap-2 p-5">
        <Heading level={1}>{copy.activate}</Heading>
        <Text className="text-slate-600">{copy.mvpNote}</Text>
      </header>

      {error ? (
        <div
          className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="kuteka-glass flex flex-col gap-8 p-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">{copy.fields.title}</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={copy.fields.titlePlaceholder}
            required
            minLength={3}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="type">{copy.fields.type}</Label>
            <select
              id="type"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as (typeof PROPERTY_TYPES)[number])}
              className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {copy.types[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Finalidade comercial */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{copy.sections.commercial}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.sections.commercialHint}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="purpose">{copy.fields.purpose}</Label>
            <select
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as (typeof PROPERTY_PURPOSES)[number])}
              className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {PROPERTY_PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {copy.purposes[p]}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 2. Serviços Kuteka */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{copy.sections.services}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.sections.servicesHint}</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {KUTEKA_SERVICES.map((svc) => (
              <li key={svc}>
                <label className="flex cursor-pointer items-start gap-2 rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={requestedServices.includes(svc)}
                    onChange={() =>
                      setRequestedServices((prev) => toggleInList(prev, svc as KutekaService))
                    }
                  />
                  <span>{SERVICE_LABELS[svc] ?? svc}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* 3. Gestão patrimonial */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{copy.sections.management}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.sections.managementHint}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="management">{copy.fields.management}</Label>
            <select
              id="management"
              value={managementLevel}
              onChange={(e) => setManagementLevel(e.target.value as ManagementLevel)}
              className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {MANAGEMENT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {MANAGEMENT_LABELS[level] ?? level}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* 4. Obra inacabada */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{copy.sections.unfinished}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.sections.unfinishedHint}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="construction">{copy.fields.construction}</Label>
              <select
                id="construction"
                value={constructionStatus}
                onChange={(e) =>
                  setConstructionStatus(e.target.value as (typeof CONSTRUCTION_STATUSES)[number])
                }
                className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {CONSTRUCTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CONSTRUCTION_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="unfinished">{copy.fields.unfinishedIntent}</Label>
              <select
                id="unfinished"
                value={unfinishedIntent}
                onChange={(e) =>
                  setUnfinishedIntent(e.target.value as (typeof UNFINISHED_INTENTS)[number])
                }
                className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {UNFINISHED_INTENTS.map((s) => (
                  <option key={s} value={s}>
                    {UNFINISHED_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* 5. Remodelação */}
        <section className="flex flex-col gap-3 border-t border-slate-200 pt-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{copy.sections.renovation}</h2>
            <p className="mt-1 text-sm text-slate-600">{copy.sections.renovationHint}</p>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {RENOVATION_REQUESTS.map((item) => (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-2 rounded-kuteka border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={renovationRequests.includes(item)}
                    onChange={() =>
                      setRenovationRequests((prev) =>
                        toggleInList(
                          prev,
                          item as NonNullable<ActivatePropertyInput['renovationRequests']>[number],
                        ),
                      )
                    }
                  />
                  <span>{RENOVATION_LABELS[item] ?? item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Localização Manual Cap.5 */}
        <section className="flex flex-col gap-4 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">{copy.sections.location}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="province">{copy.fields.province}</Label>
              <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="municipality">{copy.fields.municipality}</Label>
              <Input
                id="municipality"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="commune">{copy.fields.commune}</Label>
              <Input id="commune" value={commune} onChange={(e) => setCommune(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">{copy.fields.city}</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="neighborhood">{copy.fields.neighborhood}</Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="streetNumber">{copy.fields.streetNumber}</Label>
              <Input
                id="streetNumber"
                value={streetNumber}
                onChange={(e) => setStreetNumber(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">{copy.fields.address}</Label>
            <Input
              id="address"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="lat">{copy.fields.latitude}</Label>
              <Input
                id="lat"
                inputMode="decimal"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="-8.838"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lng">{copy.fields.longitude}</Label>
              <Input
                id="lng"
                inputMode="decimal"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="13.234"
              />
            </div>
          </div>
        </section>

        {/* 7. Características */}
        <section className="flex flex-col gap-4 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">
            {copy.sections.characteristics}
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">{copy.fields.price}</Label>
              <Input
                id="price"
                inputMode="numeric"
                value={priceAoa}
                onChange={(e) => setPriceAoa(e.target.value)}
                placeholder={copy.fields.pricePlaceholder}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="conservation">{copy.fields.conservation}</Label>
              <select
                id="conservation"
                value={conservationState}
                onChange={(e) =>
                  setConservationState(e.target.value as (typeof CONSERVATION_STATES)[number])
                }
                className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {CONSERVATION_STATES.map((s) => (
                  <option key={s} value={s}>
                    {CONSERVATION_LABELS[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bedrooms">{copy.fields.bedrooms}</Label>
              <Input
                id="bedrooms"
                inputMode="numeric"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="4"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="bathrooms">{copy.fields.bathrooms}</Label>
              <Input
                id="bathrooms"
                inputMode="numeric"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="3"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="areaTotal">{copy.fields.areaTotal}</Label>
              <Input
                id="areaTotal"
                inputMode="decimal"
                value={areaTotal}
                onChange={(e) => setAreaTotal(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="areaUseful">{copy.fields.areaUseful}</Label>
              <Input
                id="areaUseful"
                inputMode="decimal"
                value={areaUseful}
                onChange={(e) => setAreaUseful(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="yearBuilt">{copy.fields.yearBuilt}</Label>
              <Input
                id="yearBuilt"
                inputMode="numeric"
                value={yearBuilt}
                onChange={(e) => setYearBuilt(e.target.value)}
                placeholder="2018"
              />
            </div>
          </div>
        </section>

        {/* 8. Infraestruturas */}
        <section className="flex flex-col gap-4 border-t border-slate-200 pt-6">
          <h2 className="text-base font-semibold text-slate-900">{copy.sections.infrastructure}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TriBool
              id="water"
              label={copy.infra.water}
              value={hasPipedWater}
              onChange={setHasPipedWater}
            />
            <TriBool
              id="electricity"
              label={copy.infra.electricity}
              value={hasElectricity}
              onChange={setHasElectricity}
            />
            <TriBool
              id="generator"
              label={copy.infra.generator}
              value={hasGenerator}
              onChange={setHasGenerator}
            />
            <TriBool
              id="internet"
              label={copy.infra.internet}
              value={hasInternet}
              onChange={setHasInternet}
            />
            <TriBool
              id="security"
              label={copy.infra.security}
              value={hasSecurity}
              onChange={setHasSecurity}
            />
            <TriBool
              id="paved"
              label={copy.infra.paved}
              value={hasPavedStreet}
              onChange={setHasPavedStreet}
            />
            <TriBool
              id="schools"
              label={copy.infra.schools}
              value={nearSchools}
              onChange={setNearSchools}
            />
            <TriBool
              id="hospitals"
              label={copy.infra.hospitals}
              value={nearHospitals}
              onChange={setNearHospitals}
            />
            <TriBool
              id="markets"
              label={copy.infra.markets}
              value={nearMarkets}
              onChange={setNearMarkets}
            />
            <TriBool
              id="transport"
              label={copy.infra.transport}
              value={nearTransport}
              onChange={setNearTransport}
            />
          </div>
        </section>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-6">
          <Label htmlFor="notes">{copy.fields.notes}</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        <PropertyMediaEditor value={media} onChange={setMedia} disabled={submitting} />

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className={cn(buttonVariants({ variant: 'primary' }))}
          >
            {submitting ? copy.activating : copy.activate}
          </button>
          <Link
            href="/app/habitacao/explorar"
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            Ver inventário Cliente
          </Link>
        </div>
      </form>

      <FlowNextSteps
        title="Fluxo operacional após o registo"
        steps={[
          { href: '/app/confianca', label: 'Verificação de identidade', primary: true },
          { href: '/app/patrimonios', label: 'Os seus patrimónios' },
          { href: '/app/contratos', label: 'Contratos' },
          { href: '/app/agente', label: 'Área do Agente' },
        ]}
      />
    </div>
  );
}
