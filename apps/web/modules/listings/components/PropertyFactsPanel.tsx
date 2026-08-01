import { formatAoa } from '@/lib/format/aoa';
import { AMENITY_LABELS, type EnrichedListing } from '../types';

function asAmenityList(value: EnrichedListing['amenities']): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="kuteka-detail-fact">
      <dt className="kuteka-detail-label">{label}</dt>
      <dd className="kuteka-detail-value">{value}</dd>
    </div>
  );
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
  const amenities = asAmenityList(row.amenities);

  return (
    <section className="kuteka-detail-panel p-5 sm:p-6" aria-labelledby="facts-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--kuteka-detail-line)] pb-4">
        <div>
          <p className="kuteka-detail-eyebrow">Ficha do património</p>
          <h2 id="facts-heading" className="kuteka-detail-title mt-1">
            Informações essenciais
          </h2>
        </div>
        <p className="kuteka-detail-price">{formatAoa(row.price_aoa, row.purpose)}</p>
      </div>

      {(row.description || row.notes) && (
        <div className="mt-5">
          <h3 className="kuteka-detail-subtitle">Descrição</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">
            {row.description || row.notes}
          </p>
        </div>
      )}

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Fact label="Tipologia" value={typeLabel} />
        <Fact label="Finalidade" value={purposeLabel} />
        <Fact label="Província" value={row.province || '—'} />
        <Fact label="Cidade" value={row.city || '—'} />
        <Fact label="Bairro" value={row.neighborhood || '—'} />
        <Fact label="Morada" value={row.address_line || '—'} />
        {row.bedrooms != null ? <Fact label="Quartos" value={`T${row.bedrooms}`} /> : null}
        {row.bathrooms != null ? (
          <Fact label="Casas de banho" value={String(row.bathrooms)} />
        ) : null}
        {row.area_useful_m2 != null ? (
          <Fact
            label="Área útil"
            value={`${Number(row.area_useful_m2).toLocaleString('pt-AO')} m²`}
          />
        ) : null}
        {row.area_total_m2 != null ? (
          <Fact
            label="Área total"
            value={`${Number(row.area_total_m2).toLocaleString('pt-AO')} m²`}
          />
        ) : null}
        {row.floors != null ? <Fact label="Pisos" value={String(row.floors)} /> : null}
        {row.parking_spaces != null ? (
          <Fact label="Estacionamento" value={`${row.parking_spaces} lugar(es)`} />
        ) : null}
        {row.year_built != null ? (
          <Fact label="Ano de construção" value={String(row.year_built)} />
        ) : null}
        {row.renovated_year != null ? (
          <Fact label="Remodelação" value={String(row.renovated_year)} />
        ) : null}
        {row.monthly_condo_aoa != null ? (
          <Fact
            label="Custos mensais (condomínio)"
            value={`${Number(row.monthly_condo_aoa).toLocaleString('pt-AO')} AOA`}
          />
        ) : null}
      </dl>

      {amenities.length ? (
        <div className="mt-6">
          <h3 className="kuteka-detail-subtitle">Comodidades & serviços</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {amenities.map((key) => (
              <li key={key} className="kuteka-detail-chip kuteka-detail-chip--accent">
                {AMENITY_LABELS[key] ?? key}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {row.condo_rules ? (
        <div className="mt-6">
          <h3 className="kuteka-detail-subtitle">Regras do condomínio</h3>
          <p className="kuteka-detail-body mt-2 whitespace-pre-wrap">{row.condo_rules}</p>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {row.video_url ? (
          <a
            href={row.video_url}
            target="_blank"
            rel="noreferrer"
            className="kuteka-detail-chip kuteka-detail-chip--accent"
          >
            Vídeo da casa
          </a>
        ) : (
          <span className="kuteka-detail-chip">Vídeo · em breve</span>
        )}
        {row.virtual_tour_url ? (
          <a
            href={row.virtual_tour_url}
            target="_blank"
            rel="noreferrer"
            className="kuteka-detail-chip kuteka-detail-chip--accent"
          >
            Visita 360°
          </a>
        ) : (
          <span className="kuteka-detail-chip">Visita 360° · em breve</span>
        )}
        {row.floor_plan_url ? (
          <a
            href={row.floor_plan_url}
            target="_blank"
            rel="noreferrer"
            className="kuteka-detail-chip kuteka-detail-chip--accent"
          >
            Planta
          </a>
        ) : (
          <span className="kuteka-detail-chip">Planta · em breve</span>
        )}
        {row.documents_url ? (
          <a
            href={row.documents_url}
            target="_blank"
            rel="noreferrer"
            className="kuteka-detail-chip kuteka-detail-chip--accent"
          >
            Documentos
          </a>
        ) : (
          <span className="kuteka-detail-chip">Documentos · sob pedido</span>
        )}
      </div>
    </section>
  );
}
