'use client';

import type { EnrichedListing, ListingMedia } from '../types';
import { PropertyFactsPanel } from './PropertyFactsPanel';
import { PropertyGallery } from './PropertyGallery';
import { PropertyMapPanel } from './PropertyMapPanel';
import { PropertyReviews } from './PropertyReviews';
import { PropertyTimeline } from './PropertyTimeline';

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
 */
export function PropertyShowcase({
  row,
  media,
  activeUrl,
  onSelectMedia,
  typeLabel,
  purposeLabel,
}: PropertyShowcaseProps) {
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
      <PropertyFactsPanel row={row} typeLabel={typeLabel} purposeLabel={purposeLabel} />
      <PropertyMapPanel
        latitude={row.latitude}
        longitude={row.longitude}
        locationExact={row.location_exact}
        neighborhood={row.neighborhood}
        city={row.city}
        province={row.province}
        nearbyNotes={row.nearby_notes}
      />
      <PropertyTimeline propertyId={row.id} />
      <PropertyReviews propertyId={row.id} />
    </div>
  );
}
