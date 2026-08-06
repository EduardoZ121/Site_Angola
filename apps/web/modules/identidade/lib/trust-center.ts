/** Centro de Confiança Kuteka — estado da conta + próximos passos KIS. */

import type { IdentityBundle } from '../services/identity-client';
import type { IdentidadeCopy } from '../content';
import {
  statusGlyph,
  statusLabel,
  suggestNextKisStep,
  computeGradualKisProgress,
  kisProgressFlagsFromBundle,
  type KisStepId,
  type KycLevel,
  type TrustPillar,
  type TrustPillarStatus,
} from './kyc';

export type AccountLifecycleStatus = 'active' | 'restricted' | 'pending';

export type TrustCenterModel = {
  accountStatus: AccountLifecycleStatus;
  accountLabel: string;
  kycLevel: KycLevel;
  kycLabel: string;
  uts: number;
  utsBand: 'excellent' | 'good' | 'fair' | 'low';
  utsBandLabel: string;
  completeness: number;
  pillars: TrustPillar[];
  nextStepId: KisStepId;
  nextStepTitle: string;
  nextStepBody: string;
  unlockHints: string[];
};

function emailPillar(bundle: IdentityBundle): TrustPillarStatus {
  return bundle.emailConfirmed ? 'verified' : 'pending';
}

function phonePillar(bundle: IdentityBundle): TrustPillarStatus {
  if (bundle.profile.phone_verified_at) return 'verified';
  if (bundle.profile.phone_primary) return 'pending';
  return 'missing';
}

function photoPillar(bundle: IdentityBundle): TrustPillarStatus {
  const s = bundle.profile.kyc_photo_status;
  if (s === 'verified' || s === 'pending' || s === 'rejected') return s;
  return bundle.profile.avatar_url ? 'verified' : 'missing';
}

export function utsBand(score: number): TrustCenterModel['utsBand'] {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 40) return 'fair';
  return 'low';
}

export function utsBandLabel(band: TrustCenterModel['utsBand'], copy: IdentidadeCopy): string {
  return copy.trustCenter.utsBandLabels[band];
}

export function buildTrustCenterModel(
  bundle: IdentityBundle,
  copy: IdentidadeCopy,
): TrustCenterModel {
  const p = bundle.profile;
  const level = Math.min(4, Math.max(0, p.kyc_level ?? 0)) as KycLevel;
  const uts = Number(p.trust_index ?? 0);
  const flags = kisProgressFlagsFromBundle(bundle);
  const completeness = computeGradualKisProgress(flags);
  const band = utsBand(uts);
  const pillarsCopy = copy.pillars;

  const pillars: TrustPillar[] = [
    { id: 'identity', label: pillarsCopy.identity, status: p.kyc_identity_status ?? 'missing' },
    { id: 'document', label: pillarsCopy.document, status: p.kyc_document_status ?? 'missing' },
    { id: 'email', label: pillarsCopy.email, status: emailPillar(bundle) },
    { id: 'phone', label: pillarsCopy.phone, status: phonePillar(bundle) },
    { id: 'photo', label: pillarsCopy.photo, status: photoPillar(bundle) },
    { id: 'address', label: pillarsCopy.address, status: p.kyc_address_status ?? 'missing' },
    { id: 'banking', label: pillarsCopy.banking, status: p.kyc_banking_status ?? 'missing' },
  ];

  const nextStepId = suggestNextKisStep(flags);

  const nextCopy = nextStepCopy(nextStepId, level, copy);
  const hints = copy.trustCenter.unlockHints;
  const unlockHints: string[] = [];
  if (level < 2) {
    unlockHints.push(hints.level2);
  } else if (level < 3) {
    unlockHints.push(hints.level3);
  } else if (level < 4) {
    unlockHints.push(hints.level4);
  }

  const accountStatus: AccountLifecycleStatus =
    level >= 2 ? 'active' : bundle.emailConfirmed ? 'pending' : 'restricted';

  return {
    accountStatus,
    accountLabel:
      accountStatus === 'active'
        ? copy.trustCenter.accountActive
        : accountStatus === 'pending'
          ? copy.trustCenter.accountPending
          : copy.trustCenter.accountRestricted,
    kycLevel: level,
    kycLabel: copy.trustCenter.kycLevelLabels[level],
    uts,
    utsBand: band,
    utsBandLabel: utsBandLabel(band, copy),
    completeness,
    pillars,
    nextStepId,
    nextStepTitle: nextCopy.title,
    nextStepBody: nextCopy.body,
    unlockHints,
  };
}

function nextStepCopy(
  step: KisStepId,
  level: KycLevel,
  copy: IdentidadeCopy,
): { title: string; body: string } {
  const steps = copy.trustCenter.nextSteps;
  switch (step) {
    case 'contacts':
      return {
        title: steps.contacts.title,
        body: level < 2 ? steps.contacts.bodyLow : steps.contacts.bodyHigh,
      };
    case 'personal':
      return steps.personal;
    case 'document':
      return steps.document;
    case 'photo':
      return steps.photo;
    case 'address':
      return steps.address;
    case 'banking':
      return steps.banking;
    default:
      return steps.overview;
  }
}

/** KAI suggestions derived from the Trust Center / KIS. */
export function buildKisKaiSuggestions(
  bundle: IdentityBundle,
  copy: IdentidadeCopy,
): {
  id: string;
  tone: 'info' | 'warn' | 'success' | 'predict';
  title: string;
  body: string;
  href: string;
}[] {
  const model = buildTrustCenterModel(bundle, copy);
  const kai = copy.trustCenter.kai;
  const out: ReturnType<typeof buildKisKaiSuggestions> = [];

  if (model.kycLevel < 2) {
    out.push({
      id: 'kis-pay-gate',
      tone: 'warn',
      title: kai.payGateTitle,
      body: `${statusGlyph('pending')} KYC ${model.kycLevel}/2 · UTS ${Math.round(model.uts)}. ${model.nextStepTitle}`,
      href: '/app/centro-confianca',
    });
  } else if (model.nextStepId === 'contacts' || model.nextStepId === 'address') {
    out.push({
      id: 'kis-next',
      tone: 'info',
      title: model.nextStepTitle,
      body: kai.nextBodyTemplate.replace('{pct}', String(Math.round(model.completeness))),
      href: '/app/centro-confianca',
    });
  } else if (model.utsBand === 'excellent' && model.kycLevel >= 3) {
    out.push({
      id: 'kis-strong',
      tone: 'success',
      title: kai.strongTitleTemplate
        .replace('{uts}', String(Math.round(model.uts)))
        .replace('{band}', model.utsBandLabel),
      body: kai.strongBody,
      href: '/app/centro-confianca',
    });
  } else if (model.nextStepId !== 'overview') {
    out.push({
      id: 'kis-complete',
      tone: 'predict',
      title: kai.completeTitle,
      body: model.nextStepBody,
      href: '/app/centro-confianca',
    });
  }

  return out.slice(0, 2);
}

export function pillarLine(pillar: TrustPillar, copy?: IdentidadeCopy): string {
  const labels = copy?.trustCenter.statusLabels;
  return `${statusGlyph(pillar.status)} ${pillar.label} — ${statusLabel(pillar.status, labels)}`;
}
