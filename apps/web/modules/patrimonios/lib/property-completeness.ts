/** Pure property completeness checklist — progressive activation UX (Doc3). */

export type PropertyCompletenessInput = {
  cover_image_url?: string | null;
  media_count?: number | null;
  purpose?: string | null;
  property_type?: string | null;
  title?: string | null;
  price_aoa?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_total_m2?: number | null;
  area_useful_m2?: number | null;
  province?: string | null;
  city?: string | null;
  address_line?: string | null;
  documents_url?: string | null;
  legal_notes?: string | null;
  /** Owner KIS/KYC level when known (optional). */
  owner_kyc_level?: number | null;
  /** True when partner identity is considered confirmed. */
  identity_confirmed?: boolean | null;
  status?: string | null;
  review_status?: string | null;
  lifecycle_status?: string | null;
};

export type PropertyCompletenessItemId =
  'photos' | 'characteristics' | 'docs' | 'identity' | 'purpose' | 'activation_request';

export type PropertyCompletenessResult = {
  percent: number;
  missing: PropertyCompletenessItemId[];
  done: PropertyCompletenessItemId[];
};

const ITEMS: PropertyCompletenessItemId[] = [
  'photos',
  'characteristics',
  'docs',
  'identity',
  'purpose',
  'activation_request',
];

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasPhotos(row: PropertyCompletenessInput): boolean {
  if ((row.media_count ?? 0) > 0) return true;
  return hasText(row.cover_image_url);
}

function hasCharacteristics(row: PropertyCompletenessInput): boolean {
  const hasRooms = row.bedrooms != null || row.bathrooms != null;
  const hasArea = row.area_total_m2 != null || row.area_useful_m2 != null;
  const hasLocation = hasText(row.province) || hasText(row.city) || hasText(row.address_line);
  return hasRooms || hasArea || hasLocation;
}

function hasDocs(row: PropertyCompletenessInput): boolean {
  return hasText(row.documents_url) || hasText(row.legal_notes);
}

function hasIdentity(row: PropertyCompletenessInput): boolean {
  if (row.identity_confirmed === true) return true;
  if (row.owner_kyc_level != null && row.owner_kyc_level >= 1) return true;
  return false;
}

function hasPurpose(row: PropertyCompletenessInput): boolean {
  return (
    hasText(row.purpose) &&
    hasText(row.property_type) &&
    hasText(row.title) &&
    row.price_aoa != null &&
    Number(row.price_aoa) > 0
  );
}

function hasActivationRequest(row: PropertyCompletenessInput): boolean {
  const review = row.review_status;
  if (
    review === 'in_review' ||
    review === 'approved' ||
    review === 'pending' ||
    review === 'documents_requested' ||
    review === 'corrections_requested' ||
    review === 'technical_visit_requested'
  ) {
    return true;
  }
  const life = row.lifecycle_status;
  if (
    life === 'em_analise_kai' ||
    life === 'em_analise_admin' ||
    life === 'em_analise_documental' ||
    life === 'publicado' ||
    life === 'submetido'
  ) {
    return true;
  }
  return row.status === 'active';
}

const CHECKERS: Record<PropertyCompletenessItemId, (row: PropertyCompletenessInput) => boolean> = {
  photos: hasPhotos,
  characteristics: hasCharacteristics,
  docs: hasDocs,
  identity: hasIdentity,
  purpose: hasPurpose,
  activation_request: hasActivationRequest,
};

/** Progressive completeness: percent 0–100 and missing checklist ids. */
export function propertyCompleteness(row: PropertyCompletenessInput): PropertyCompletenessResult {
  const done: PropertyCompletenessItemId[] = [];
  const missing: PropertyCompletenessItemId[] = [];
  for (const id of ITEMS) {
    if (CHECKERS[id](row)) done.push(id);
    else missing.push(id);
  }
  const percent = Math.round((done.length / ITEMS.length) * 100);
  return { percent, missing, done };
}

export const PROPERTY_COMPLETENESS_LABELS_PT: Record<PropertyCompletenessItemId, string> = {
  photos: 'Fotografias',
  characteristics: 'Características',
  docs: 'Documentos',
  identity: 'Identidade (KIS)',
  purpose: 'Finalidade e preço',
  activation_request: 'Pedido de activação',
};
