'use client';

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

function buildPois(props: PropertyMapPanelProps): Poi[] {
  const items: Poi[] = [];
  if (props.nearSchools !== false) {
    items.push({ label: 'Escolas / colégios', eta: '5–12 min', kind: 'educação' });
  }
  if (props.nearHospitals !== false) {
    items.push({ label: 'Hospitais / clínicas', eta: '10–20 min', kind: 'saúde' });
  }
  if (props.nearMarkets !== false) {
    items.push({ label: 'Mercados / supermercados', eta: '5–15 min', kind: 'comércio' });
  }
  if (props.nearTransport !== false) {
    items.push({ label: 'Transportes públicos', eta: '5–10 min', kind: 'mobilidade' });
  }
  items.push({ label: 'Bancos / ATM', eta: '8–18 min', kind: 'serviços' });
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
  if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return (
      <section className="kuteka-detail-panel p-5" aria-labelledby="map-heading">
        <h2 id="map-heading" className="kuteka-detail-title">
          Localização
        </h2>
        <p className="kuteka-detail-body mt-2">
          Mapa disponível quando o património tiver coordenadas GPS no registo.
        </p>
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
  const pois = buildPois({
    latitude,
    longitude,
    nearSchools,
    nearHospitals,
    nearMarkets,
    nearTransport,
  });

  return (
    <section className="kuteka-detail-panel overflow-hidden" aria-labelledby="map-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="map-heading" className="kuteka-detail-title">
              Localização & envolvente
            </h2>
            <p className="kuteka-detail-meta mt-1">
              {exact
                ? 'Localização exacta (autorizada)'
                : 'Zona aproximada (privacidade do proprietário)'}
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
              OpenStreetMap
            </a>
            <a
              href={streetView}
              target="_blank"
              rel="noreferrer"
              className="kuteka-detail-chip kuteka-detail-chip--accent"
            >
              Street View
            </a>
            <a href={googleMaps} target="_blank" rel="noreferrer" className="kuteka-detail-chip">
              Google Maps
            </a>
          </div>
        </div>
      </div>
      <div className="aspect-[16/9] w-full bg-slate-200 sm:aspect-[21/9]">
        <iframe
          title="Mapa do património"
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="space-y-3 px-5 py-4">
        <h3 className="kuteka-detail-subtitle">Pontos de interesse próximos</h3>
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
        <p className="kuteka-detail-meta">
          Tempos estimados em condições normais de trânsito — confirme no Street View / mapa
          completo.
        </p>
      </div>
    </section>
  );
}
