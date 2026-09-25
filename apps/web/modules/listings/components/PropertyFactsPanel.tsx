'use client';

import { FormEvent, useEffect, useState } from 'react';
import { formatAoa } from '@/lib/format/aoa';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { LOCALE_INTL_TAG } from '@/modules/i18n/types';
import { getListingsCopy } from '../content';
import {
  getAmenityLabels,
  getConservationLabels,
  getConstructionLabels,
  getManagementLabels,
} from '../lib/manual-ops-labels';
import type { EnrichedListing } from '../types';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="kuteka-detail-fact">
      <dt className="kuteka-detail-label">{label}</dt>
      <dd className="kuteka-detail-value">{value}</dd>
    </div>
  );
}

function asAmenityList(value: EnrichedListing['amenities']): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

type PropertyFactsPanelProps = {
  row: EnrichedListing;
  typeLabel: string;
  purposeLabel: string;
};

/**
 * High-contrast facts panel — AA/AAA readable over cinematic atmosphere.
 */
export function PropertyFactsPanel({ row, typeLabel, purposeLabel }: PropertyFactsPanelProps) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).facts;
  const { session } = useAppSession();
  const [canEdit, setCanEdit] = useState(false);
  const [video, setVideo] = useState(row.video_url ?? '');
  const [tour, setTour] = useState(row.virtual_tour_url ?? '');
  const [plan, setPlan] = useState(row.floor_plan_url ?? '');
  const [docs, setDocs] = useState(row.documents_url ?? '');
  const [shown, setShown] = useState({
    video: row.video_url ?? '',
    tour: row.virtual_tour_url ?? '',
    plan: row.floor_plan_url ?? '',
    docs: row.documents_url ?? '',
  });
  const [mediaNote, setMediaNote] = useState<string | null>(null);
  const [savingMedia, setSavingMedia] = useState(false);
  const amenityLabels = getAmenityLabels(locale);
  const conservationLabels = getConservationLabels(locale);
  const constructionLabels = getConstructionLabels(locale);
  const managementLabels = getManagementLabels(locale);
  const amenities = asAmenityList(row.amenities);
  const intl = LOCALE_INTL_TAG[locale];

  function yesNo(value: boolean | null | undefined): string | null {
    if (value == null) return null;
    return value ? copy.yes : copy.no;
  }

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!session?.permissions.includes('properties.manage')) {
        setCanEdit(false);
        return;
      }
      const client = createBrowserClient();
      const { data } = await client.auth.getUser();
      if (!cancelled) setCanEdit(data.user?.id === row.owner_id);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [row.owner_id, session]);

  function cleanUrl(value: string): string | null | false {
    const text = value.trim();
    if (!text) return null;
    try {
      const url = new URL(text);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
      return url.toString();
    } catch {
      return false;
    }
  }

  async function saveMedia(event: FormEvent) {
    event.preventDefault();
    const next = {
      video: cleanUrl(video),
      tour: cleanUrl(tour),
      plan: cleanUrl(plan),
      docs: cleanUrl(docs),
    };
    if (next.video === false || next.tour === false || next.plan === false || next.docs === false) {
      setMediaNote(copy.mediaInvalid);
      return;
    }
    setSavingMedia(true);
    setMediaNote(null);
    const client = createBrowserClient();
    const { error } = await client
      .from('properties')
      .update({
        video_url: next.video,
        virtual_tour_url: next.tour,
        floor_plan_url: next.plan,
        documents_url: next.docs,
      })
      .eq('id', row.id);
    setSavingMedia(false);
    if (error) {
      setMediaNote(copy.mediaInvalid);
      return;
    }
    setShown({
      video: next.video ?? '',
      tour: next.tour ?? '',
      plan: next.plan ?? '',
      docs: next.docs ?? '',
    });
    setMediaNote(copy.mediaSaved);
  }

  function areaValue(n: number): string {
    return copy.areaM2Template.replace('{n}', Number(n).toLocaleString(intl));
  }

  return (
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="facts-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--kuteka-detail-line)] pb-4">
        <div>
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <h2 id="facts-heading" className="kuteka-detail-title mt-1">
            {copy.title}
          </h2>
        </div>
        <p className="kuteka-detail-price">{formatAoa(row.price_aoa, row.purpose)}</p>
      </div>

      {(row.description || row.notes) && (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">{copy.description}</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">
            {row.description || row.notes}
          </p>
        </div>
      )}

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label={copy.typology} value={typeLabel} />
        <Fact label={copy.commercialPurpose} value={purposeLabel} />
        {row.management_level ? (
          <Fact
            label={copy.managementLevel}
            value={managementLabels[row.management_level] ?? row.management_level}
          />
        ) : null}
        <Fact label={copy.province} value={row.province || '—'} />
        <Fact label={copy.municipality} value={row.municipality || '—'} />
        <Fact label={copy.commune} value={row.commune || '—'} />
        <Fact label={copy.city} value={row.city || '—'} />
        <Fact label={copy.neighborhood} value={row.neighborhood || '—'} />
        <Fact label={copy.street} value={row.address_line || '—'} />
        <Fact label={copy.streetNumber} value={row.street_number || '—'} />
        {row.latitude != null && row.longitude != null ? (
          <Fact
            label={copy.gps}
            value={`${Number(row.latitude).toFixed(5)}, ${Number(row.longitude).toFixed(5)}`}
          />
        ) : null}
        {row.bedrooms != null ? <Fact label={copy.bedrooms} value={`T${row.bedrooms}`} /> : null}
        {row.bathrooms != null ? (
          <Fact label={copy.bathrooms} value={String(row.bathrooms)} />
        ) : null}
        {row.area_useful_m2 != null ? (
          <Fact label={copy.usefulArea} value={areaValue(row.area_useful_m2)} />
        ) : null}
        {row.area_total_m2 != null ? (
          <Fact label={copy.totalArea} value={areaValue(row.area_total_m2)} />
        ) : null}
        {row.floors != null ? <Fact label={copy.floors} value={String(row.floors)} /> : null}
        {row.parking_spaces != null ? (
          <Fact
            label={copy.parking}
            value={copy.parkingTemplate.replace('{n}', String(row.parking_spaces))}
          />
        ) : null}
        {row.year_built != null ? (
          <Fact label={copy.yearBuilt} value={String(row.year_built)} />
        ) : null}
        {row.conservation_state ? (
          <Fact
            label={copy.conservation}
            value={conservationLabels[row.conservation_state] ?? row.conservation_state}
          />
        ) : null}
        {row.construction_status ? (
          <Fact
            label={copy.construction}
            value={constructionLabels[row.construction_status] ?? row.construction_status}
          />
        ) : null}
        {row.renovated_year != null ? (
          <Fact label={copy.renovation} value={String(row.renovated_year)} />
        ) : null}
        {row.monthly_condo_aoa != null ? (
          <Fact
            label={copy.monthlyCondo}
            value={`${Number(row.monthly_condo_aoa).toLocaleString(intl)} AOA`}
          />
        ) : null}
        {yesNo(row.has_piped_water) ? (
          <Fact label={copy.pipedWater} value={yesNo(row.has_piped_water)!} />
        ) : null}
        {yesNo(row.has_electricity) ? (
          <Fact label={copy.electricity} value={yesNo(row.has_electricity)!} />
        ) : null}
        {yesNo(row.has_generator) ? (
          <Fact label={copy.generator} value={yesNo(row.has_generator)!} />
        ) : null}
        {yesNo(row.has_internet) ? (
          <Fact label={copy.internet} value={yesNo(row.has_internet)!} />
        ) : null}
        {yesNo(row.has_security) ? (
          <Fact label={copy.security} value={yesNo(row.has_security)!} />
        ) : null}
        {yesNo(row.has_paved_street) ? (
          <Fact label={copy.pavedStreet} value={yesNo(row.has_paved_street)!} />
        ) : null}
        {yesNo(row.near_schools) ? (
          <Fact label={copy.nearSchools} value={yesNo(row.near_schools)!} />
        ) : null}
        {yesNo(row.near_hospitals) ? (
          <Fact label={copy.nearHospitals} value={yesNo(row.near_hospitals)!} />
        ) : null}
        {yesNo(row.near_markets) ? (
          <Fact label={copy.nearMarkets} value={yesNo(row.near_markets)!} />
        ) : null}
        {yesNo(row.near_transport) ? (
          <Fact label={copy.nearTransport} value={yesNo(row.near_transport)!} />
        ) : null}
      </dl>

      {amenities.length ? (
        <div className="mt-6">
          <h3 className="kuteka-detail-subtitle">{copy.amenitiesTitle}</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {amenities.map((key) => (
              <li key={key} className="kuteka-detail-chip kuteka-detail-chip--accent">
                {amenityLabels[key] ?? key}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {row.condo_rules ? (
        <div className="mt-6">
          <h3 className="kuteka-detail-subtitle">{copy.condoRulesTitle}</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">{row.condo_rules}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {shown.video ? (
          <a href={shown.video} target="_blank" rel="noreferrer" className="kuteka-detail-chip kuteka-detail-chip--accent">
            {copy.video}
          </a>
        ) : (
          <span className="kuteka-detail-chip">{copy.videoSoon}</span>
        )}
        {shown.tour ? (
          <a href={shown.tour} target="_blank" rel="noreferrer" className="kuteka-detail-chip kuteka-detail-chip--accent">
            {copy.tour}
          </a>
        ) : (
          <span className="kuteka-detail-chip">{copy.tourSoon}</span>
        )}
        {shown.plan ? (
          <a href={shown.plan} target="_blank" rel="noreferrer" className="kuteka-detail-chip kuteka-detail-chip--accent">
            {copy.floorPlan}
          </a>
        ) : (
          <span className="kuteka-detail-chip">{copy.floorPlanSoon}</span>
        )}
        {shown.docs ? (
          <a href={shown.docs} target="_blank" rel="noreferrer" className="kuteka-detail-chip kuteka-detail-chip--accent">
            {copy.documents}
          </a>
        ) : (
          <span className="kuteka-detail-chip">{copy.documentsOnRequest}</span>
        )}
      </div>
      {canEdit ? (
        <form onSubmit={saveMedia} className="mt-4 flex flex-col gap-2">
          <p className="kuteka-detail-meta">{copy.mediaHint}</p>
          <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder={copy.video} className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input value={tour} onChange={(e) => setTour(e.target.value)} placeholder={copy.tour} className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder={copy.floorPlan} className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm" />
          <input value={docs} onChange={(e) => setDocs(e.target.value)} placeholder={copy.documents} className="rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm" />
          {mediaNote ? <p className="text-sm text-slate-700">{mediaNote}</p> : null}
          <button type="submit" disabled={savingMedia} className="kuteka-detail-chip kuteka-detail-chip--accent w-fit">
            {savingMedia ? copy.mediaSaving : copy.mediaSave}
          </button>
        </form>
      ) : null}
    </section>
  );
}
