'use client';

import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getListingsCopy, type ListingsCopy } from '../content';

type PropertyMapPanelProps = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  locationExact?: boolean | null;
  neighborhood?: string | null;
  city?: string | null;
  province?: string | null;
  nearbyNotes?: string | null;
  nearSchools?: boolean | null;
  nearHospitals?: boolean | null;
  nearMarkets?: boolean | null;
  nearTransport?: boolean | null;
};

type Poi = { label: string; eta: string; kind: string };

function buildPois(
  props: Pick<
    PropertyMapPanelProps,
    'nearSchools' | 'nearHospitals' | 'nearMarkets' | 'nearTransport'
  >,
  copy: ListingsCopy['map'],
): Poi[] {
  const items: Poi[] = [];
  if (props.nearSchools !== false) {
    items.push({
      label: copy.poiSchools,
      eta: copy.poiSchoolsEta,
      kind: copy.poiSchoolsKind,
    });
  }
  if (props.nearHospitals !== false) {
    items.push({
      label: copy.poiHospitals,
      eta: copy.poiHospitalsEta,
      kind: copy.poiHospitalsKind,
    });
  }
  if (props.nearMarkets !== false) {
    items.push({
      label: copy.poiMarkets,
      eta: copy.poiMarketsEta,
      kind: copy.poiMarketsKind,
    });
  }
  if (props.nearTransport !== false) {
    items.push({
      label: copy.poiTransport,
      eta: copy.poiTransportEta,
      kind: copy.poiTransportKind,
    });
  }
  items.push({ label: copy.poiBanks, eta: copy.poiBanksEta, kind: copy.poiBanksKind });
  return items;
}

/**
 * OpenStreetMap + Street View link + pontos de interesse próximos.
 */
export function PropertyMapPanel({
  latitude,
  longitude,
  locationExact,
  neighborhood,
  city,
  province,
  nearbyNotes,
  nearSchools,
  nearHospitals,
  nearMarkets,
  nearTransport,
}: PropertyMapPanelProps) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).map;

  if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return (
      <section className="kuteka-detail-panel p-5" aria-labelledby="map-heading">
        <h2 id="map-heading" className="kuteka-detail-title">
          {copy.title}
        </h2>
        <p className="kuteka-detail-body mt-2">{copy.noCoords}</p>
      </section>
    );
  }

  const exact = Boolean(locationExact);
  const lat = exact ? latitude : latitude + 0.008;
  const lng = exact ? longitude : longitude + 0.006;
  const delta = 0.02;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const place = [neighborhood, city, province].filter(Boolean).join(' · ');
  const streetView = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  const googleMaps = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  const pois = buildPois({ nearSchools, nearHospitals, nearMarkets, nearTransport }, copy);

  return (
    <section className="kuteka-detail-panel overflow-hidden" aria-labelledby="map-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="map-heading" className="kuteka-detail-title">
              {copy.titleWithSurroundings}
            </h2>
            <p className="kuteka-detail-meta mt-1">
              {exact ? copy.exactLocation : copy.approximateLocation}
              {place ? ` · ${place}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
              target="_blank"
              rel="noreferrer"
              className="kuteka-detail-chip kuteka-detail-chip--accent"
            >
              {copy.openStreetMap}
            </a>
            <a
              href={streetView}
              target="_blank"
              rel="noreferrer"
              className="kuteka-detail-chip kuteka-detail-chip--accent"
            >
              {copy.streetView}
            </a>
            <a href={googleMaps} target="_blank" rel="noreferrer" className="kuteka-detail-chip">
              {copy.googleMaps}
            </a>
          </div>
        </div>
      </div>
      <div className="aspect-[16/9] w-full bg-slate-200 sm:aspect-[21/9]">
        <iframe
          title={copy.iframeTitle}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="space-y-3 px-5 py-4">
        <h3 className="kuteka-detail-subtitle">{copy.poisTitle}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pois.map((poi) => (
            <li
              key={poi.label}
              className="flex items-center justify-between gap-2 rounded-kuteka border border-[var(--kuteka-detail-line)] bg-white/60 px-3 py-2"
            >
              <span>
                <span className="block text-sm font-semibold text-[#08263f]">{poi.label}</span>
                <span className="text-xs text-slate-600">{poi.kind}</span>
              </span>
              <span className="shrink-0 text-xs font-bold text-[#08263f]">{poi.eta}</span>
            </li>
          ))}
        </ul>
        {nearbyNotes ? <p className="kuteka-detail-body">{nearbyNotes}</p> : null}
        <p className="kuteka-detail-meta">{copy.etaDisclaimer}</p>
      </div>
    </section>
  );
}
