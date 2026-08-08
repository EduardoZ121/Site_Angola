'use client';

import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getListingsCopy } from '../content';
import type { EnrichedListing, ListingMedia } from '../types';
import { PropertyDigitalPassport } from './PropertyDigitalPassport';
import { PropertyEvaluationPanel } from './PropertyEvaluationPanel';
import { PropertyFactsPanel } from './PropertyFactsPanel';
import { PropertyGallery } from './PropertyGallery';
import { PropertyHealthPanel } from './PropertyHealthPanel';
import { PropertyMapPanel } from './PropertyMapPanel';
import { PropertyReviews } from './PropertyReviews';
import { PropertyServiceContractPanel } from './PropertyServiceContractPanel';
import { PropertySocialPanel } from './PropertySocialPanel';
import { PropertyTimeline } from './PropertyTimeline';
import { PropertyTrustPanel } from './PropertyTrustPanel';

type PropertyShowcaseProps = {
  row: EnrichedListing;
  media: ListingMedia[];
  activeUrl: string | null;
  onSelectMedia: (url: string) => void;
  typeLabel: string;
  purposeLabel: string;
};

/**
 * Premium listing body shared by Habitação and Patrimónios detail pages.
 * Manual ops panels are additive — Showcase chrome unchanged.
 */
export function PropertyShowcase({
  row,
  media,
  activeUrl,
  onSelectMedia,
  typeLabel,
  purposeLabel,
}: PropertyShowcaseProps) {
  const { locale } = useLocale();
  const copy = getListingsCopy(locale).showcase;
  const gallery =
    media.length > 0
      ? media
      : row.cover_image_url
        ? [
            {
              id: 'cover',
              property_id: row.id,
              storage_path: null,
              public_url: row.cover_image_url,
              sort_order: 0,
              is_primary: true,
            },
          ]
        : [];

  return (
    <div className="flex flex-col gap-5">
      <PropertyGallery
        title={row.title}
        activeUrl={activeUrl}
        gallery={gallery}
        onSelect={onSelectMedia}
      />
      <PropertyTrustPanel propertyId={row.id} />
      <PropertyFactsPanel row={row} typeLabel={typeLabel} purposeLabel={purposeLabel} />
      <PropertySocialPanel propertyId={row.id} />
      <nav aria-label={copy.navAria} className="kuteka-detail-panel flex flex-wrap gap-2 px-4 py-3">
        {[
          { href: '#pdk', label: copy.navPdk },
          { href: '#saude', label: copy.navHealth },
          { href: '#avaliacao', label: copy.navEvaluation },
          { href: '#contrato-kuteka', label: copy.navContract },
          { href: '#historico', label: copy.navHistory },
          { href: '#avaliacoes', label: copy.navReviews },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="kuteka-detail-chip kuteka-detail-chip--accent"
          >
            {item.label}
          </a>
        ))}
      </nav>
      <PropertyDigitalPassport row={row} mediaCount={gallery.length} />
      <PropertyHealthPanel row={row} />
      <PropertyEvaluationPanel propertyId={row.id} />
      <PropertyServiceContractPanel propertyId={row.id} />
      <PropertyMapPanel
        latitude={row.latitude}
        longitude={row.longitude}
        locationExact={row.location_exact}
        neighborhood={row.neighborhood}
        city={row.city}
        province={row.province}
        nearbyNotes={row.nearby_notes}
        nearSchools={row.near_schools}
        nearHospitals={row.near_hospitals}
        nearMarkets={row.near_markets}
        nearTransport={row.near_transport}
      />
      <PropertyTimeline propertyId={row.id} />
      <PropertyReviews propertyId={row.id} />
    </div>
  );
}
