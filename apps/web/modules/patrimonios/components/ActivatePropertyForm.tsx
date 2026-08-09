'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState, type ReactNode } from 'react';
import { Heading, Text, Input, Label, Textarea, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import {
  COMMISSION_SETTLEMENTS,
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
import { useLocale } from '@/modules/i18n/LocaleProvider';
import {
  getConservationLabels,
  getConstructionLabels,
  getManagementLabels,
  getRenovationLabels,
  getServiceLabels,
  getUnfinishedLabels,
} from '@/modules/listings/lib/manual-ops-labels';
import { FlowNextSteps } from '@/modules/shell/components/FlowNextSteps';
import { getPatrimoniosCopy } from '../content';
import { activateProperty } from '../services/properties-client';
import type { LocalMediaDraft } from '../services/property-media-client';
import { PropertyMediaEditor } from './PropertyMediaEditor';

const DRAFT_STORAGE_KEY = 'kuteka.activate-property.draft';

const WIZARD_STEP_IDS = [
  'media',
  'essentials',
  'commercial',
  'services',
  'location',
  'characteristics',
  'review',
] as const;

type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

type MediaDraftMeta = {
  key: string;
  previewUrl: string;
  isPrimary: boolean;
  remoteId?: string;
  storagePath?: string | null;
  publicUrl?: string;
};

type ActivatePropertyDraft = {
  version: 1;
  step: number;
  title: string;
  propertyType: (typeof PROPERTY_TYPES)[number];
  purpose: (typeof PROPERTY_PURPOSES)[number];
  managementLevel: ManagementLevel;
  requestedServices: KutekaService[];
  renovationRequests: NonNullable<ActivatePropertyInput['renovationRequests']>;
  constructionStatus: (typeof CONSTRUCTION_STATUSES)[number];
  unfinishedIntent: (typeof UNFINISHED_INTENTS)[number];
  conservationState: (typeof CONSERVATION_STATES)[number];
  province: string;
  municipality: string;
  commune: string;
  city: string;
  neighborhood: string;
  addressLine: string;
  streetNumber: string;
  latitude: string;
  longitude: string;
  notes: string;
  priceAoa: string;
  bedrooms: string;
  bathrooms: string;
  suites: string;
  parkingSpaces: string;
  furnished: boolean | null;
  hasGarage: boolean | null;
  hasYard: boolean | null;
  hasPool: boolean | null;
  hasGarden: boolean | null;
  hasAnnex: boolean | null;
  hasEquippedKitchen: boolean | null;
  hasBalcony: boolean | null;
  hasTerrace: boolean | null;
  landArea: string;
  builtArea: string;
  areaTotal: string;
  areaUseful: string;
  yearBuilt: string;
  hasPipedWater: boolean | null;
  hasElectricity: boolean | null;
  hasGenerator: boolean | null;
  hasInternet: boolean | null;
  hasSecurity: boolean | null;
  hasPavedStreet: boolean | null;
  nearSchools: boolean | null;
  nearHospitals: boolean | null;
  nearMarkets: boolean | null;
  nearTransport: boolean | null;
  commissionSettlement: (typeof COMMISSION_SETTLEMENTS)[number] | '';
  media: MediaDraftMeta[];
  savedAt: string;
};

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function mediaToMeta(drafts: LocalMediaDraft[]): MediaDraftMeta[] {
  return drafts.map((d) => ({
    key: d.key,
    previewUrl: d.publicUrl ?? (d.previewUrl.startsWith('blob:') ? '' : d.previewUrl),
    isPrimary: d.isPrimary,
    remoteId: d.remoteId,
    storagePath: d.storagePath,
    publicUrl: d.publicUrl,
  }));
}

function metaToMedia(meta: MediaDraftMeta[]): LocalMediaDraft[] {
  const out: LocalMediaDraft[] = [];
  for (const m of meta) {
    const preview = m.publicUrl || m.previewUrl;
    if (!preview) continue;
    out.push({
      key: m.key,
      previewUrl: preview,
      isPrimary: m.isPrimary,
      remoteId: m.remoteId,
      storagePath: m.storagePath,
      publicUrl: m.publicUrl ?? preview,
    });
  }
  return out;
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
      <legend className="kuteka-detail-label">{label}</legend>
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

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="kuteka-detail-label">
      {children}
    </Label>
  );
}

export function ActivatePropertyForm() {
  const { locale } = useLocale();
  const copy = getPatrimoniosCopy(locale);
  const serviceLabels = getServiceLabels(locale);
  const managementLabels = getManagementLabels(locale);
  const constructionLabels = getConstructionLabels(locale);
  const unfinishedLabels = getUnfinishedLabels(locale);
  const renovationLabels = getRenovationLabels(locale);
  const conservationLabels = getConservationLabels(locale);
  const router = useRouter();
  const { session, status } = useAppSession();
  const canManage = session?.permissions.includes('properties.manage') ?? false;
  const draftHydrated = useRef(false);

  const [stepIndex, setStepIndex] = useState(0);
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
  const [suites, setSuites] = useState('');
  const [parkingSpaces, setParkingSpaces] = useState('');
  const [furnished, setFurnished] = useState<boolean | null>(null);
  const [hasGarage, setHasGarage] = useState<boolean | null>(null);
  const [hasYard, setHasYard] = useState<boolean | null>(null);
  const [hasPool, setHasPool] = useState<boolean | null>(null);
  const [hasGarden, setHasGarden] = useState<boolean | null>(null);
  const [hasAnnex, setHasAnnex] = useState<boolean | null>(null);
  const [hasEquippedKitchen, setHasEquippedKitchen] = useState<boolean | null>(null);
  const [hasBalcony, setHasBalcony] = useState<boolean | null>(null);
  const [hasTerrace, setHasTerrace] = useState<boolean | null>(null);
  const [landArea, setLandArea] = useState('');
  const [builtArea, setBuiltArea] = useState('');
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
  const [commissionSettlement, setCommissionSettlement] = useState<
    (typeof COMMISSION_SETTLEMENTS)[number] | ''
  >('');
  const [media, setMedia] = useState<LocalMediaDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = WIZARD_STEP_IDS.length;
  const currentStepId: WizardStepId = WIZARD_STEP_IDS[stepIndex] ?? 'media';
  const isLastStep = stepIndex === totalSteps - 1;

  function buildDraftPayload(nextStep = stepIndex): ActivatePropertyDraft {
    return {
      version: 1,
      step: nextStep,
      title,
      propertyType,
      purpose,
      managementLevel,
      requestedServices,
      renovationRequests,
      constructionStatus,
      unfinishedIntent,
      conservationState,
      province,
      municipality,
      commune,
      city,
      neighborhood,
      addressLine,
      streetNumber,
      latitude,
      longitude,
      notes,
      priceAoa,
      bedrooms,
      bathrooms,
      suites,
      parkingSpaces,
      furnished,
      hasGarage,
      hasYard,
      hasPool,
      hasGarden,
      hasAnnex,
      hasEquippedKitchen,
      hasBalcony,
      hasTerrace,
      landArea,
      builtArea,
      areaTotal,
      areaUseful,
      yearBuilt,
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
      commissionSettlement,
      media: mediaToMeta(media),
      savedAt: new Date().toISOString(),
    };
  }

  function applyDraft(draft: ActivatePropertyDraft) {
    setTitle(draft.title ?? '');
    if (PROPERTY_TYPES.includes(draft.propertyType)) setPropertyType(draft.propertyType);
    if (PROPERTY_PURPOSES.includes(draft.purpose)) setPurpose(draft.purpose);
    if (MANAGEMENT_LEVELS.includes(draft.managementLevel)) {
      setManagementLevel(draft.managementLevel);
    }
    setRequestedServices(
      Array.isArray(draft.requestedServices) && draft.requestedServices.length > 0
        ? draft.requestedServices
        : ['announce'],
    );
    setRenovationRequests(Array.isArray(draft.renovationRequests) ? draft.renovationRequests : []);
    if (CONSTRUCTION_STATUSES.includes(draft.constructionStatus)) {
      setConstructionStatus(draft.constructionStatus);
    }
    if (UNFINISHED_INTENTS.includes(draft.unfinishedIntent)) {
      setUnfinishedIntent(draft.unfinishedIntent);
    }
    if (CONSERVATION_STATES.includes(draft.conservationState)) {
      setConservationState(draft.conservationState);
    }
    setProvince(draft.province ?? '');
    setMunicipality(draft.municipality ?? '');
    setCommune(draft.commune ?? '');
    setCity(draft.city ?? '');
    setNeighborhood(draft.neighborhood ?? '');
    setAddressLine(draft.addressLine ?? '');
    setStreetNumber(draft.streetNumber ?? '');
    setLatitude(draft.latitude ?? '');
    setLongitude(draft.longitude ?? '');
    setNotes(draft.notes ?? '');
    setPriceAoa(draft.priceAoa ?? '');
    setBedrooms(draft.bedrooms ?? '');
    setBathrooms(draft.bathrooms ?? '');
    setSuites(draft.suites ?? '');
    setParkingSpaces(draft.parkingSpaces ?? '');
    setFurnished(draft.furnished ?? null);
    setHasGarage(draft.hasGarage ?? null);
    setHasYard(draft.hasYard ?? null);
    setHasPool(draft.hasPool ?? null);
    setHasGarden(draft.hasGarden ?? null);
    setHasAnnex(draft.hasAnnex ?? null);
    setHasEquippedKitchen(draft.hasEquippedKitchen ?? null);
    setHasBalcony(draft.hasBalcony ?? null);
    setHasTerrace(draft.hasTerrace ?? null);
    setLandArea(draft.landArea ?? '');
    setBuiltArea(draft.builtArea ?? '');
    setAreaTotal(draft.areaTotal ?? '');
    setAreaUseful(draft.areaUseful ?? '');
    setYearBuilt(draft.yearBuilt ?? '');
    setHasPipedWater(draft.hasPipedWater ?? null);
    setHasElectricity(draft.hasElectricity ?? null);
    setHasGenerator(draft.hasGenerator ?? null);
    setHasInternet(draft.hasInternet ?? null);
    setHasSecurity(draft.hasSecurity ?? null);
    setHasPavedStreet(draft.hasPavedStreet ?? null);
    setNearSchools(draft.nearSchools ?? null);
    setNearHospitals(draft.nearHospitals ?? null);
    setNearMarkets(draft.nearMarkets ?? null);
    setNearTransport(draft.nearTransport ?? null);
    if (
      draft.commissionSettlement === '' ||
      COMMISSION_SETTLEMENTS.includes(
        draft.commissionSettlement as (typeof COMMISSION_SETTLEMENTS)[number],
      )
    ) {
      setCommissionSettlement(draft.commissionSettlement ?? '');
    }
    setMedia(metaToMedia(Array.isArray(draft.media) ? draft.media : []));
    const restoredStep =
      typeof draft.step === 'number' && draft.step >= 0 && draft.step < totalSteps ? draft.step : 0;
    setStepIndex(restoredStep);
  }

  useEffect(() => {
    if (draftHydrated.current) return;
    draftHydrated.current = true;
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ActivatePropertyDraft;
      if (!parsed || parsed.version !== 1) return;
      applyDraft(parsed);
      setInfoMessage(copy.wizard.draftRestored);
    } catch (err) {
      console.error('Failed to restore activate-property draft', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  function saveDraft(showToast = true) {
    try {
      const payload = buildDraftPayload();
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      if (showToast) {
        setInfoMessage(copy.wizard.draftSaved);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to save activate-property draft', err);
      setError(copy.saveError);
    }
  }

  function clearDraft() {
    try {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear activate-property draft', err);
    }
  }

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

  function validateCurrentStep(): boolean {
    if (currentStepId === 'essentials') {
      if (title.trim().length < 3) {
        setError(copy.wizard.titleRequired);
        return false;
      }
    }
    setError(null);
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setInfoMessage(null);
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }

  function goBack() {
    setError(null);
    setInfoMessage(null);
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLastStep) {
      goNext();
      return;
    }
    setError(null);
    setInfoMessage(null);
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
        suites: parseNum(suites),
        parkingSpaces: parseNum(parkingSpaces),
        furnished,
        hasGarage,
        hasYard,
        hasPool,
        hasGarden,
        hasAnnex,
        hasEquippedKitchen,
        hasBalcony,
        hasTerrace,
        landAreaM2: parseNum(landArea),
        builtAreaM2: parseNum(builtArea),
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
        commissionSettlement: commissionSettlement || null,
      },
      media,
    );
    setSubmitting(false);
    if (!result.ok) {
      console.error('activateProperty failed', result.message);
      setError(copy.saveError);
      return;
    }
    clearDraft();
    router.push(`/app/patrimonios/detalhe?id=${result.id}&submitted=1`);
  }

  const stepLabel = copy.wizard.steps[currentStepId];
  const progressPct = ((stepIndex + 1) / totalSteps) * 100;
  const stepOfLabel = copy.wizard.stepOf
    .replace('{current}', String(stepIndex + 1))
    .replace('{total}', String(totalSteps));

  return (
    <div className="flex flex-col gap-6">
      <header className="kuteka-detail-panel flex flex-col gap-2 p-5">
        <Heading level={1}>{copy.activate}</Heading>
        <Text className="text-slate-800">{copy.mvpNote}</Text>
      </header>

      {infoMessage ? (
        <div
          className="rounded-kuteka border border-emerald-300/50 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
          role="status"
        >
          {infoMessage}
        </div>
      ) : null}

      {error ? (
        <div
          className="rounded-kuteka border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="kuteka-detail-panel flex flex-col gap-6 p-5" noValidate>
        <div className="flex flex-col gap-3" aria-live="polite">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="kuteka-detail-label">{stepOfLabel}</p>
              <h2 className="kuteka-detail-title mt-1">{stepLabel}</h2>
            </div>
            <ol className="hidden gap-1 sm:flex" aria-hidden>
              {WIZARD_STEP_IDS.map((id, i) => (
                <li
                  key={id}
                  className={cn(
                    'h-1.5 w-6 rounded-full',
                    i <= stepIndex ? 'bg-brand-700' : 'bg-stone-200',
                  )}
                />
              ))}
            </ol>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-valuenow={stepIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-label={stepOfLabel}
          >
            <div
              className="h-full rounded-full bg-brand-700 transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {currentStepId === 'media' ? (
          <section className="flex flex-col gap-3" aria-labelledby="step-media">
            <div>
              <h3 id="step-media" className="kuteka-detail-title">
                {copy.sections.media}
              </h3>
            </div>
            <PropertyMediaEditor value={media} onChange={setMedia} disabled={submitting} />
          </section>
        ) : null}

        {currentStepId === 'essentials' ? (
          <section className="flex flex-col gap-5" aria-labelledby="step-essentials">
            <div>
              <h3 id="step-essentials" className="kuteka-detail-title">
                {copy.sections.essentials}
              </h3>
              <p className="mt-1 text-sm text-slate-800">{copy.sections.essentialsHint}</p>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="title">{copy.fields.title}</FieldLabel>
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
                <FieldLabel htmlFor="type">{copy.fields.type}</FieldLabel>
                <select
                  id="type"
                  value={propertyType}
                  onChange={(e) =>
                    setPropertyType(e.target.value as (typeof PROPERTY_TYPES)[number])
                  }
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {copy.types[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="purpose">{copy.fields.purpose}</FieldLabel>
                <select
                  id="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as (typeof PROPERTY_PURPOSES)[number])}
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                >
                  {PROPERTY_PURPOSES.map((p) => (
                    <option key={p} value={p}>
                      {copy.purposes[p]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        ) : null}

        {currentStepId === 'commercial' ? (
          <section className="flex flex-col gap-5" aria-labelledby="step-commercial">
            <div>
              <h3 id="step-commercial" className="kuteka-detail-title">
                {copy.sections.commercialPrice}
              </h3>
              <p className="mt-1 text-sm text-slate-800">{copy.sections.commercialPriceHint}</p>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="price">{copy.fields.price}</FieldLabel>
              <Input
                id="price"
                inputMode="numeric"
                value={priceAoa}
                onChange={(e) => setPriceAoa(e.target.value)}
                placeholder={copy.fields.pricePlaceholder}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="commissionSettlement">
                {copy.fields.commissionSettlement}
              </FieldLabel>
              <select
                id="commissionSettlement"
                value={commissionSettlement}
                onChange={(e) =>
                  setCommissionSettlement(
                    e.target.value as (typeof COMMISSION_SETTLEMENTS)[number] | '',
                  )
                }
                className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
              >
                <option value="">—</option>
                {COMMISSION_SETTLEMENTS.map((opt) => (
                  <option key={opt} value={opt}>
                    {copy.commissionSettlements[opt]}
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}

        {currentStepId === 'services' ? (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-3" aria-labelledby="step-services">
              <div>
                <h3 id="step-services" className="kuteka-detail-title">
                  {copy.sections.services}
                </h3>
                <p className="mt-1 text-sm text-slate-800">{copy.sections.servicesHint}</p>
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
                      <span>{serviceLabels[svc] ?? svc}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-3 border-t border-stone-200 pt-6">
              <div>
                <h3 className="kuteka-detail-title">{copy.sections.management}</h3>
                <p className="mt-1 text-sm text-slate-800">{copy.sections.managementHint}</p>
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="management">{copy.fields.management}</FieldLabel>
                <select
                  id="management"
                  value={managementLevel}
                  onChange={(e) => setManagementLevel(e.target.value as ManagementLevel)}
                  className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                >
                  {MANAGEMENT_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {managementLabels[level] ?? level}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            <section className="flex flex-col gap-3 border-t border-stone-200 pt-6">
              <div>
                <h3 className="kuteka-detail-title">{copy.sections.unfinished}</h3>
                <p className="mt-1 text-sm text-slate-800">{copy.sections.unfinishedHint}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="construction">{copy.fields.construction}</FieldLabel>
                  <select
                    id="construction"
                    value={constructionStatus}
                    onChange={(e) =>
                      setConstructionStatus(
                        e.target.value as (typeof CONSTRUCTION_STATUSES)[number],
                      )
                    }
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                  >
                    {CONSTRUCTION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {constructionLabels[s] ?? s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="unfinished">{copy.fields.unfinishedIntent}</FieldLabel>
                  <select
                    id="unfinished"
                    value={unfinishedIntent}
                    onChange={(e) =>
                      setUnfinishedIntent(e.target.value as (typeof UNFINISHED_INTENTS)[number])
                    }
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                  >
                    {UNFINISHED_INTENTS.map((s) => (
                      <option key={s} value={s}>
                        {unfinishedLabels[s] ?? s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3 border-t border-stone-200 pt-6">
              <div>
                <h3 className="kuteka-detail-title">{copy.sections.renovation}</h3>
                <p className="mt-1 text-sm text-slate-800">{copy.sections.renovationHint}</p>
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
                              item as NonNullable<
                                ActivatePropertyInput['renovationRequests']
                              >[number],
                            ),
                          )
                        }
                      />
                      <span>{renovationLabels[item] ?? item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {currentStepId === 'location' ? (
          <section className="flex flex-col gap-4" aria-labelledby="step-location">
            <h3 id="step-location" className="kuteka-detail-title">
              {copy.sections.location}
            </h3>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="province">{copy.fields.province}</FieldLabel>
                <Input
                  id="province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="municipality">{copy.fields.municipality}</FieldLabel>
                <Input
                  id="municipality"
                  value={municipality}
                  onChange={(e) => setMunicipality(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="commune">{copy.fields.commune}</FieldLabel>
                <Input id="commune" value={commune} onChange={(e) => setCommune(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="city">{copy.fields.city}</FieldLabel>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="neighborhood">{copy.fields.neighborhood}</FieldLabel>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="streetNumber">{copy.fields.streetNumber}</FieldLabel>
                <Input
                  id="streetNumber"
                  value={streetNumber}
                  onChange={(e) => setStreetNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="address">{copy.fields.address}</FieldLabel>
              <Input
                id="address"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="lat">{copy.fields.latitude}</FieldLabel>
                <Input
                  id="lat"
                  inputMode="decimal"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-8.838"
                />
              </div>
              <div className="flex flex-col gap-2">
                <FieldLabel htmlFor="lng">{copy.fields.longitude}</FieldLabel>
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
        ) : null}

        {currentStepId === 'characteristics' ? (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4" aria-labelledby="step-chars">
              <h3 id="step-chars" className="kuteka-detail-title">
                {copy.sections.characteristics}
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="conservation">{copy.fields.conservation}</FieldLabel>
                  <select
                    id="conservation"
                    value={conservationState}
                    onChange={(e) =>
                      setConservationState(e.target.value as (typeof CONSERVATION_STATES)[number])
                    }
                    className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
                  >
                    {CONSERVATION_STATES.map((s) => (
                      <option key={s} value={s}>
                        {conservationLabels[s] ?? s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="bedrooms">{copy.fields.bedrooms}</FieldLabel>
                  <Input
                    id="bedrooms"
                    inputMode="numeric"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    placeholder="4"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="bathrooms">{copy.fields.bathrooms}</FieldLabel>
                  <Input
                    id="bathrooms"
                    inputMode="numeric"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    placeholder="3"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="suites">{copy.fields.suites}</FieldLabel>
                  <Input
                    id="suites"
                    inputMode="numeric"
                    value={suites}
                    onChange={(e) => setSuites(e.target.value)}
                    placeholder="2"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="parkingSpaces">{copy.fields.parkingSpaces}</FieldLabel>
                  <Input
                    id="parkingSpaces"
                    inputMode="numeric"
                    value={parkingSpaces}
                    onChange={(e) => setParkingSpaces(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="areaTotal">{copy.fields.areaTotal}</FieldLabel>
                  <Input
                    id="areaTotal"
                    inputMode="decimal"
                    value={areaTotal}
                    onChange={(e) => setAreaTotal(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="areaUseful">{copy.fields.areaUseful}</FieldLabel>
                  <Input
                    id="areaUseful"
                    inputMode="decimal"
                    value={areaUseful}
                    onChange={(e) => setAreaUseful(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="landArea">{copy.fields.landArea}</FieldLabel>
                  <Input
                    id="landArea"
                    inputMode="decimal"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="builtArea">{copy.fields.builtArea}</FieldLabel>
                  <Input
                    id="builtArea"
                    inputMode="decimal"
                    value={builtArea}
                    onChange={(e) => setBuiltArea(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="yearBuilt">{copy.fields.yearBuilt}</FieldLabel>
                  <Input
                    id="yearBuilt"
                    inputMode="numeric"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    placeholder="2018"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TriBool
                  id="furnished"
                  label={copy.fields.furnished}
                  value={furnished}
                  onChange={setFurnished}
                />
                <TriBool
                  id="garage"
                  label={copy.amenities.garage}
                  value={hasGarage}
                  onChange={setHasGarage}
                />
                <TriBool
                  id="yard"
                  label={copy.amenities.yard}
                  value={hasYard}
                  onChange={setHasYard}
                />
                <TriBool
                  id="pool"
                  label={copy.amenities.pool}
                  value={hasPool}
                  onChange={setHasPool}
                />
                <TriBool
                  id="garden"
                  label={copy.amenities.garden}
                  value={hasGarden}
                  onChange={setHasGarden}
                />
                <TriBool
                  id="annex"
                  label={copy.amenities.annex}
                  value={hasAnnex}
                  onChange={setHasAnnex}
                />
                <TriBool
                  id="equippedKitchen"
                  label={copy.amenities.equippedKitchen}
                  value={hasEquippedKitchen}
                  onChange={setHasEquippedKitchen}
                />
                <TriBool
                  id="balcony"
                  label={copy.amenities.balcony}
                  value={hasBalcony}
                  onChange={setHasBalcony}
                />
                <TriBool
                  id="terrace"
                  label={copy.amenities.terrace}
                  value={hasTerrace}
                  onChange={setHasTerrace}
                />
              </div>
            </section>

            <section className="flex flex-col gap-4 border-t border-stone-200 pt-6">
              <h3 className="kuteka-detail-title">{copy.sections.infrastructure}</h3>
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
          </div>
        ) : null}

        {currentStepId === 'review' ? (
          <section className="flex flex-col gap-5" aria-labelledby="step-review">
            <div>
              <h3 id="step-review" className="kuteka-detail-title">
                {copy.sections.review}
              </h3>
              <p className="mt-1 text-sm text-slate-800">{copy.wizard.reviewHint}</p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="kuteka-detail-label">{copy.fields.title}</dt>
                <dd className="kuteka-detail-value">{title.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="kuteka-detail-label">{copy.fields.type}</dt>
                <dd className="kuteka-detail-value">{copy.types[propertyType]}</dd>
              </div>
              <div>
                <dt className="kuteka-detail-label">{copy.fields.purpose}</dt>
                <dd className="kuteka-detail-value">{copy.purposes[purpose]}</dd>
              </div>
              <div>
                <dt className="kuteka-detail-label">{copy.fields.price}</dt>
                <dd className="kuteka-detail-value">{priceAoa.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="kuteka-detail-label">{copy.fields.commissionSettlement}</dt>
                <dd className="kuteka-detail-value">
                  {commissionSettlement ? copy.commissionSettlements[commissionSettlement] : '—'}
                </dd>
              </div>
              <div>
                <dt className="kuteka-detail-label">{copy.fields.province}</dt>
                <dd className="kuteka-detail-value">{province.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="kuteka-detail-label">{copy.fields.city}</dt>
                <dd className="kuteka-detail-value">{city.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="kuteka-detail-label">{copy.sections.media}</dt>
                <dd className="kuteka-detail-value">{media.length}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-2">
              <FieldLabel htmlFor="notes">{copy.fields.notes}</FieldLabel>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-stone-200 pt-5">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className={cn(buttonVariants({ variant: 'secondary' }))}
            >
              {copy.wizard.back}
            </button>
          ) : null}
          {!isLastStep ? (
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className={cn(buttonVariants({ variant: 'primary' }))}
            >
              {copy.wizard.continue}
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className={cn(buttonVariants({ variant: 'primary' }))}
            >
              {submitting ? copy.activating : copy.activate}
            </button>
          )}
          <button
            type="button"
            onClick={() => saveDraft(true)}
            disabled={submitting}
            className={cn(buttonVariants({ variant: 'secondary' }))}
          >
            {copy.wizard.saveDraft}
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
