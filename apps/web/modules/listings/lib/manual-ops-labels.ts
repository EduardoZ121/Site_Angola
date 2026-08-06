/** Labels for Manual Operacional fields — shared by activate form + detail panels. */

import type { AppLocale } from '@/modules/i18n/types';
import { getListingsCopy } from '../content';

export function getServiceLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.service;
}

export function getManagementLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.management;
}

export function getRenovationLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.renovation;
}

export function getUnfinishedLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.unfinished;
}

export function getConstructionLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.construction;
}

export function getConservationLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.conservation;
}

export function getLifecycleLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.lifecycle;
}

export function getPartnerCategoryLabels(
  locale?: AppLocale | string | null,
): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.partnerCategory;
}

export function getAmenityLabels(locale?: AppLocale | string | null): Record<string, string> {
  return getListingsCopy(locale ?? undefined).opsLabels.amenities;
}

export const PARTNER_LIFECYCLE_STAGE_KEYS = [
  'descoberta',
  'registo',
  'verificacao',
  'registo_patrimonio',
  'verificacao_tecnica',
  'avaliacao',
  'contrato_servicos',
  'publicacao',
  'gestao_comercial',
  'negociacao',
  'formalizacao',
  'pos_contrato',
  'avaliacao_experiencia',
  'fidelizacao',
  'reativacao',
] as const;

export function getPartnerLifecycleStages(
  locale?: AppLocale | string | null,
): { key: (typeof PARTNER_LIFECYCLE_STAGE_KEYS)[number]; label: string }[] {
  const labels = getListingsCopy(locale ?? undefined).opsLabels.partnerLifecycleStage;
  return PARTNER_LIFECYCLE_STAGE_KEYS.map((key) => ({ key, label: labels[key] }));
}

export function mapDbLifecycleToStage(db: string | null | undefined): string {
  switch (db) {
    case 'registado':
      return 'registo';
    case 'em_verificacao':
      return 'verificacao';
    case 'verificado':
      return 'verificacao';
    case 'com_imovel_em_avaliacao':
      return 'avaliacao';
    case 'imovel_publicado':
      return 'publicacao';
    case 'em_negociacao':
      return 'negociacao';
    case 'contrato_ativo':
      return 'formalizacao';
    case 'gestao_ativa':
      return 'pos_contrato';
    default:
      return 'registo_patrimonio';
  }
}

export function asHistoryList(
  value: unknown,
): Array<{ at?: string; note?: string; score?: number }> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is { at?: string; note?: string; score?: number } => {
    return item != null && typeof item === 'object';
  });
}
