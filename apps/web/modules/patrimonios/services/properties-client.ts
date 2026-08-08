'use client';

import {
  activatePropertySchema,
  propertyRequiresEvaluation,
  type ActivatePropertyInput,
} from '@kuteka/validation';
import { writeAuditLog } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { ENRICHED_PROPERTY_SELECT, ENRICHED_PROPERTY_SELECT_V13 } from '@/modules/listings/types';
import { getPatrimoniosCopy } from '../content';
import { uploadPropertyMedia, type LocalMediaDraft } from './property-media-client';

export type PropertyRow = {
  id: string;
  owner_id: string;
  code: string;
  title: string;
  property_type: string;
  purpose: string;
  province: string | null;
  city: string | null;
  address_line: string | null;
  status: string;
  notes: string | null;
  price_aoa: number | null;
  bedrooms: number | null;
  cover_image_url: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
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
  suites?: number | null;
  furnished?: boolean | null;
  has_garage?: boolean | null;
  has_yard?: boolean | null;
  has_pool?: boolean | null;
  has_garden?: boolean | null;
  has_annex?: boolean | null;
  has_equipped_kitchen?: boolean | null;
  has_balcony?: boolean | null;
  has_terrace?: boolean | null;
  land_area_m2?: number | null;
  built_area_m2?: number | null;
  commission_settlement?: string | null;
  review_status?: string | null;
  monthly_condo_aoa?: number | null;
  condo_rules?: string | null;
  amenities?: unknown;
  latitude?: number | null;
  longitude?: number | null;
  location_exact?: boolean | null;
  neighborhood?: string | null;
  nearby_notes?: string | null;
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

const PROPERTY_SELECT = ENRICHED_PROPERTY_SELECT;

function newPropertyCode(): string {
  const n = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `KTK-IMM-${n}`;
}

function newServiceContractCode(): string {
  const n = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `KTK-SVC-${n}`;
}

function mapPrimaryServiceType(management: string, services: string[]): string {
  if (management === 'full_management' || services.includes('full_management')) {
    return 'full_management';
  }
  if (management === 'rental_management' || services.includes('rental_management')) {
    return 'intermediation_rent';
  }
  if (services.includes('construction_finish')) return 'construction_finish';
  if (services.includes('renovation') || services.includes('renewal')) return 'renovation';
  if (services.includes('evaluation')) return 'evaluation';
  if (services.includes('photography')) return 'photography';
  if (services.includes('home_staging')) return 'home_staging';
  if (services.includes('works_supervision')) return 'works_supervision';
  if (services.includes('condo_admin')) return 'condo_admin';
  if (management === 'find_buyer' || services.includes('find_buyer')) {
    return 'intermediation_sale';
  }
  if (management === 'find_tenant' || services.includes('find_tenant')) {
    return 'intermediation_rent';
  }
  return 'intermediation_sale';
}

export async function listMyProperties(): Promise<
  { ok: true; data: PropertyRow[] } | { ok: false; message: string }
> {
  const copy = getPatrimoniosCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const full = await client
      .from('properties')
      .select(PROPERTY_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!full.error) {
      return { ok: true, data: (full.data as unknown as PropertyRow[]) ?? [] };
    }

    const v13 = await client
      .from('properties')
      .select(ENRICHED_PROPERTY_SELECT_V13)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (v13.error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (v13.data as unknown as PropertyRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

const PROPERTY_SELECT_CORE =
  'id, owner_id, code, title, property_type, purpose, province, city, address_line, status, notes, price_aoa, bedrooms, cover_image_url, is_demo, created_at, updated_at';

export async function getProperty(
  id: string,
): Promise<{ ok: true; data: PropertyRow } | { ok: false; message: string }> {
  const copy = getPatrimoniosCopy(resolveUiLocale());
  try {
    const client = createBrowserClient();
    const enriched = await client
      .from('properties')
      .select(PROPERTY_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!enriched.error && enriched.data) {
      return { ok: true, data: enriched.data as unknown as PropertyRow };
    }

    const v13 = await client
      .from('properties')
      .select(ENRICHED_PROPERTY_SELECT_V13)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!v13.error && v13.data) {
      return { ok: true, data: v13.data as unknown as PropertyRow };
    }

    const core = await client
      .from('properties')
      .select(PROPERTY_SELECT_CORE)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (core.error || !core.data) return { ok: false, message: copy.loadError };
    return { ok: true, data: core.data as unknown as PropertyRow };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function activateProperty(
  input: ActivatePropertyInput,
  mediaDrafts: LocalMediaDraft[] = [],
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const copy = getPatrimoniosCopy(resolveUiLocale());
  const parsed = activatePropertySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }

  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const v = parsed.data;
    const primary = mediaDrafts.find((m) => m.isPrimary) ?? mediaDrafts[0];
    const needsEval = propertyRequiresEvaluation(v.requestedServices, v.managementLevel);
    // Publication gate (Beta 1.6): never publish on create — always draft + in review.
    const publishStatus = 'draft';
    const lifecycleStatus = 'rascunho';
    const reviewStatus = 'in_review';
    const code = newPropertyCode();

    const amenities: string[] = [];
    if (v.hasInternet) amenities.push('internet');
    if (v.hasElectricity) amenities.push('energia');
    if (v.hasPipedWater) amenities.push('agua');
    if (v.hasSecurity) amenities.push('seguranca');
    if (v.hasGarage) amenities.push('garage');
    if (v.hasPool) amenities.push('pool');
    if (v.hasGarden) amenities.push('garden');
    if (v.parkingSpaces != null && v.parkingSpaces > 0) amenities.push('estacionamento');

    const row: Record<string, unknown> = {
      owner_id: user.id,
      code,
      title: v.title,
      property_type: v.propertyType,
      purpose: v.purpose,
      province: v.province || null,
      city: v.city || null,
      address_line: v.addressLine || null,
      notes: v.notes || null,
      price_aoa: v.priceAoa ?? null,
      bedrooms: v.bedrooms ?? null,
      bathrooms: v.bathrooms ?? null,
      suites: v.suites ?? null,
      parking_spaces: v.parkingSpaces ?? null,
      furnished: v.furnished ?? null,
      has_garage: v.hasGarage ?? null,
      has_yard: v.hasYard ?? null,
      has_pool: v.hasPool ?? null,
      has_garden: v.hasGarden ?? null,
      has_annex: v.hasAnnex ?? null,
      has_equipped_kitchen: v.hasEquippedKitchen ?? null,
      has_balcony: v.hasBalcony ?? null,
      has_terrace: v.hasTerrace ?? null,
      land_area_m2: v.landAreaM2 ?? null,
      built_area_m2: v.builtAreaM2 ?? null,
      area_total_m2: v.areaTotalM2 ?? null,
      area_useful_m2: v.areaUsefulM2 ?? null,
      year_built: v.yearBuilt ?? null,
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
      location_exact: v.latitude != null && v.longitude != null,
      neighborhood: v.neighborhood || null,
      municipality: v.municipality || null,
      commune: v.commune || null,
      street_number: v.streetNumber || null,
      conservation_state: v.conservationState ?? null,
      construction_status: v.constructionStatus ?? null,
      management_level: v.managementLevel,
      requested_services: v.requestedServices,
      renovation_requests: v.renovationRequests ?? [],
      unfinished_intent: v.unfinishedIntent ?? 'none',
      has_piped_water: v.hasPipedWater ?? null,
      has_electricity: v.hasElectricity ?? null,
      has_generator: v.hasGenerator ?? null,
      has_internet: v.hasInternet ?? null,
      has_security: v.hasSecurity ?? null,
      has_paved_street: v.hasPavedStreet ?? null,
      near_schools: v.nearSchools ?? null,
      near_hospitals: v.nearHospitals ?? null,
      near_markets: v.nearMarkets ?? null,
      near_transport: v.nearTransport ?? null,
      commission_settlement: v.commissionSettlement ?? null,
      lifecycle_status: lifecycleStatus,
      review_status: reviewStatus,
      needs_renovation: (v.renovationRequests?.length ?? 0) > 0,
      pdk_code: `PDK-${code}`,
      amenities,
      cover_image_url: primary?.publicUrl ?? null,
      status: publishStatus,
      created_by: user.id,
      updated_by: user.id,
    };

    let insertResult = await client.from('properties').insert(row).select('id').single();

    // Before migration 0014 / 0036: retry with core columns only.
    if (insertResult.error) {
      const coreRow = {
        owner_id: user.id,
        code,
        title: v.title,
        property_type: v.propertyType,
        purpose: v.purpose,
        province: v.province || null,
        city: v.city || null,
        address_line: v.addressLine || null,
        notes: v.notes || null,
        price_aoa: v.priceAoa ?? null,
        bedrooms: v.bedrooms ?? null,
        cover_image_url: primary?.publicUrl ?? null,
        status: publishStatus,
        created_by: user.id,
        updated_by: user.id,
      };
      insertResult = await client.from('properties').insert(coreRow).select('id').single();
    }

    if (insertResult.error || !insertResult.data) {
      if (
        insertResult.error?.code === '42501' ||
        insertResult.error?.message?.toLowerCase().includes('policy')
      ) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.saveError };
    }

    const propertyId = insertResult.data.id as string;

    if (mediaDrafts.length) {
      const mediaResult = await uploadPropertyMedia(propertyId, mediaDrafts);
      if (!mediaResult.ok) return mediaResult;
    }

    // Always submit for Admin/Super review — never auto-publish (Beta 1.6 gate).
    const { error: reviewError } = await client.rpc('submit_property_for_review', {
      p_property_id: propertyId,
    });
    if (reviewError) {
      console.error('submit_property_for_review failed', reviewError);
      return { ok: false, message: copy.saveError };
    }

    // Contrato de serviços Kuteka ↔ Parceiro (Manual Cap.7) — best-effort until migration.
    try {
      const serviceType = mapPrimaryServiceType(v.managementLevel, v.requestedServices);
      await client.from('partner_service_contracts').insert({
        code: newServiceContractCode(),
        partner_id: user.id,
        property_id: propertyId,
        service_type: serviceType,
        exclusivity: v.managementLevel === 'full_management' ? 'partial' : 'none',
        status: needsEval ? 'pending_acceptance' : 'draft',
        terms_notes:
          'Contrato de prestação de serviços Kuteka ↔ Parceiro Patrimonial gerado no registo do património.',
        commission_notes: 'Comissão conforme tabela Kuteka e modalidade escolhida.',
        requested_services: v.requestedServices,
        created_by: user.id,
        updated_by: user.id,
      });
    } catch {
      // table may not exist yet
    }

    // Draft evaluation placeholder when gated (Manual Cap.6).
    if (needsEval) {
      try {
        await client.from('property_evaluations').insert({
          property_id: propertyId,
          status: 'draft',
          checklist: {
            construcao: 'pendente',
            acabamentos: 'pendente',
            eletrica: 'pendente',
            canalizacao: 'pendente',
            habitabilidade: 'pendente',
          },
          valuation_plan: 'Aguarda visita técnica e relatório oficial Kuteka.',
          report_notes: 'Avaliação técnica obrigatória antes da publicação plena.',
          created_at: new Date().toISOString(),
        });
      } catch {
        // table may not exist yet
      }
    }

    try {
      await client
        .from('profiles')
        .update({
          partner_lifecycle: 'com_imovel_em_avaliacao',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch {
      // best-effort
    }

    try {
      await writeAuditLog(client, {
        action: 'property.activated',
        entityType: 'property',
        entityId: propertyId,
        metadata: {
          code,
          title: v.title,
          media_count: mediaDrafts.length,
          management_level: v.managementLevel,
          requested_services: v.requestedServices,
          requires_evaluation: needsEval,
          status: publishStatus,
          lifecycle_status: lifecycleStatus,
          review_status: reviewStatus,
          submitted_for_review: true,
        },
      });
    } catch {
      // best-effort
    }

    return { ok: true, id: propertyId };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
