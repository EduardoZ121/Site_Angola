'use client';

type PropertyMapPanelProps = {
  latitude: number | null | undefined;
  longitude: number | null | undefined;
  locationExact?: boolean | null;
  neighborhood?: string | null;
  city?: string | null;
  province?: string | null;
  nearbyNotes?: string | null;
};

/**
 * Interactive map via OpenStreetMap embed — no API key.
 * When location_exact is false, offsets the pin (~1 km) for privacy.
 */
export function PropertyMapPanel({
  latitude,
  longitude,
  locationExact,
  neighborhood,
  city,
  province,
  nearbyNotes,
}: PropertyMapPanelProps) {
  if (latitude == null || longitude == null || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return (
      <section className="kuteka-detail-panel p-5" aria-labelledby="map-heading">
        <h2 id="map-heading" className="kuteka-detail-title">
          Localização
        </h2>
        <p className="kuteka-detail-body mt-2">
          Mapa indisponível para este anúncio. Peça ao parceiro para activar a localização.
        </p>
      </section>
    );
  }

  const exact = Boolean(locationExact);
  // Approximate zone: small offset so pin is not the door.
  const lat = exact ? latitude : latitude + 0.008;
  const lng = exact ? longitude : longitude + 0.006;
  const delta = 0.02;
  const bbox = `${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;

  const place = [neighborhood, city, province].filter(Boolean).join(' · ');

  return (
    <section className="kuteka-detail-panel overflow-hidden" aria-labelledby="map-heading">
      <div className="border-b border-[var(--kuteka-detail-line)] px-5 py-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="map-heading" className="kuteka-detail-title">
              Localização
            </h2>
            <p className="kuteka-detail-meta mt-1">
              {exact
                ? 'Localização exacta (autorizada)'
                : 'Zona aproximada (privacidade do proprietário)'}
              {place ? ` · ${place}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="kuteka-detail-chip">Mapa</span>
            <span className="kuteka-detail-chip">Zona</span>
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`}
              target="_blank"
              rel="noreferrer"
              className="kuteka-detail-chip kuteka-detail-chip--accent"
            >
              Abrir mapa completo
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
      <div className="space-y-2 px-5 py-4">
        <p className="kuteka-detail-body">
          Pontos próximos típicos: escolas, hospitais, supermercados e bancos na envolvente.
        </p>
        {nearbyNotes ? <p className="kuteka-detail-body">{nearbyNotes}</p> : null}
        <p className="kuteka-detail-meta">
          Tempo estimado até ao centro da cidade: 15–35 min (consoante trânsito em Luanda).
        </p>
      </div>
    </section>
  );
}
