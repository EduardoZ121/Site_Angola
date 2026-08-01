export type ListingMedia = {
  id: string;
  property_id: string;
  storage_path: string | null;
  public_url: string;
  sort_order: number;
  is_primary: boolean;
};

/** Shared enriched listing shape for detail showcase (patrimonios + habitação). */
export type EnrichedListing = {
  id: string;
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
};

export const ENRICHED_PROPERTY_SELECT =
  'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, updated_at, description, video_url, virtual_tour_url, floor_plan_url, documents_url, year_built, renovated_year, area_useful_m2, area_total_m2, floors, bathrooms, parking_spaces, monthly_condo_aoa, condo_rules, amenities, latitude, longitude, location_exact, neighborhood, nearby_notes';

export const HOUSING_ENRICHED_SELECT =
  'id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, description, video_url, virtual_tour_url, floor_plan_url, documents_url, year_built, renovated_year, area_useful_m2, area_total_m2, floors, bathrooms, parking_spaces, monthly_condo_aoa, condo_rules, amenities, latitude, longitude, location_exact, neighborhood, nearby_notes';

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

export const REVIEW_SUBJECT_LABELS: Record<string, string> = {
  property: 'Imóvel',
  owner: 'Proprietário',
  agent: 'Agente',
  client: 'Cliente',
  experience: 'Experiência',
};
