export type ListingMedia = {
  id: string;
  property_id: string;
  storage_path: string | null;
  public_url: string;
  sort_order: number;
  is_primary: boolean;
  media_kind?: 'image' | 'video' | null;
};

/** Shared enriched listing shape for detail showcase (patrimonios + habitação). */
export type EnrichedListing = {
  id: string;
  owner_id?: string | null;
  code: string;
  title: string;
  property_type: string;
  purpose: string;
  province: string | null;
  city: string | null;
  address_line: string | null;
  notes: string | null;
  price_aoa: number | null;
  bedrooms: number | null;
  cover_image_url: string | null;
  is_demo: boolean;
  description?: string | null;
  video_url?: string | null;
  virtual_tour_url?: string | null;
  floor_plan_url?: string | null;
  documents_url?: string | null;
  year_built?: number | null;
  renovated_year?: number | null;
  area_useful_m2?: number | null;
  area_total_m2?: number | null;
  floors?: number | null;
  bathrooms?: number | null;
  parking_spaces?: number | null;
  monthly_condo_aoa?: number | null;
  condo_rules?: string | null;
  amenities?: string[] | unknown;
  latitude?: number | null;
  longitude?: number | null;
  location_exact?: boolean | null;
  neighborhood?: string | null;
  nearby_notes?: string | null;
  /** Manual Cap.5+ (migration 0014) */
  municipality?: string | null;
  commune?: string | null;
  street_number?: string | null;
  conservation_state?: string | null;
  construction_status?: string | null;
  management_level?: string | null;
  requested_services?: unknown;
  renovation_requests?: unknown;
  unfinished_intent?: string | null;
  has_piped_water?: boolean | null;
  has_electricity?: boolean | null;
  has_generator?: boolean | null;
  has_internet?: boolean | null;
  has_security?: boolean | null;
  has_paved_street?: boolean | null;
  near_schools?: boolean | null;
  near_hospitals?: boolean | null;
  near_markets?: boolean | null;
  near_transport?: boolean | null;
  lifecycle_status?: string | null;
  kuteka_score?: number | null;
  last_maintenance_at?: string | null;
  last_inspection_at?: string | null;
  needs_renovation?: boolean | null;
  pdk_code?: string | null;
  owner_history?: unknown;
  maintenance_history?: unknown;
  inspection_history?: unknown;
  valuation_history?: unknown;
  legal_notes?: string | null;
  commercial_notes?: string | null;
};

export type TimelineEvent = {
  id: string;
  property_id: string;
  event_type: string;
  title: string;
  summary: string | null;
  occurred_at: string;
};

export type ContractReviewRow = {
  id: string;
  contract_id: string;
  property_id: string;
  reviewer_id: string;
  subject_kind: string;
  subject_user_id: string | null;
  rating: number;
  comment: string | null;
  dimensions: Record<string, number> | null;
  created_at: string;
  owner_reply?: string | null;
  owner_replied_at?: string | null;
  agent_reply?: string | null;
  agent_replied_at?: string | null;
};

const MANUAL_OPS_COLUMNS =
  'municipality, commune, street_number, conservation_state, construction_status, management_level, requested_services, renovation_requests, unfinished_intent, has_piped_water, has_electricity, has_generator, has_internet, has_security, has_paved_street, near_schools, near_hospitals, near_markets, near_transport, lifecycle_status, kuteka_score, last_maintenance_at, last_inspection_at, needs_renovation, pdk_code, owner_history, maintenance_history, inspection_history, valuation_history, legal_notes, commercial_notes';

export const ENRICHED_PROPERTY_SELECT =
  'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, updated_at, description, video_url, virtual_tour_url, floor_plan_url, documents_url, year_built, renovated_year, area_useful_m2, area_total_m2, floors, bathrooms, parking_spaces, monthly_condo_aoa, condo_rules, amenities, latitude, longitude, location_exact, neighborhood, nearby_notes, ' +
  MANUAL_OPS_COLUMNS;

export const HOUSING_ENRICHED_SELECT =
  'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, description, video_url, virtual_tour_url, floor_plan_url, documents_url, year_built, renovated_year, area_useful_m2, area_total_m2, floors, bathrooms, parking_spaces, monthly_condo_aoa, condo_rules, amenities, latitude, longitude, location_exact, neighborhood, nearby_notes, ' +
  MANUAL_OPS_COLUMNS;

/** Fallback when migration 0014 is not yet applied. */
export const ENRICHED_PROPERTY_SELECT_V13 =
  'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, updated_at, description, video_url, virtual_tour_url, floor_plan_url, documents_url, year_built, renovated_year, area_useful_m2, area_total_m2, floors, bathrooms, parking_spaces, monthly_condo_aoa, condo_rules, amenities, latitude, longitude, location_exact, neighborhood, nearby_notes';

export const HOUSING_ENRICHED_SELECT_V13 =
  'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, description, video_url, virtual_tour_url, floor_plan_url, documents_url, year_built, renovated_year, area_useful_m2, area_total_m2, floors, bathrooms, parking_spaces, monthly_condo_aoa, condo_rules, amenities, latitude, longitude, location_exact, neighborhood, nearby_notes';

/**
 * @deprecated Use getAmenityLabels(locale) from '../lib/manual-ops-labels' instead.
 * Kept as the Portuguese fallback for any legacy import.
 */
export const AMENITY_LABELS: Record<string, string> = {
  internet: 'Internet',
  energia: 'Energia',
  agua: 'Água',
  seguranca: 'Segurança',
  estacionamento: 'Estacionamento',
  piscina: 'Piscina',
  jardim: 'Jardim',
  acessibilidade: 'Acessibilidade',
};

/**
 * @deprecated Use getListingsCopy(locale).subjects from '../content' instead.
 * Kept as the Portuguese fallback for any legacy import.
 */
export const REVIEW_SUBJECT_LABELS: Record<string, string> = {
  property: 'Imóvel',
  owner: 'Proprietário',
  agent: 'Agente',
  client: 'Cliente',
  experience: 'Experiência',
};
