/** Centro de Confiança Kuteka — estado da conta + próximos passos KIS. */

import type { IdentityBundle } from '../services/identity-client';
import {
  KYC_LEVEL_LABELS,
  statusGlyph,
  statusLabel,
  suggestNextKisStep,
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

export function utsBandLabel(band: TrustCenterModel['utsBand']): string {
  if (band === 'excellent') return 'Excelente';
  if (band === 'good') return 'Bom';
  if (band === 'fair') return 'Em evolução';
  return 'Inicial';
}

export function buildTrustCenterModel(bundle: IdentityBundle): TrustCenterModel {
  const p = bundle.profile;
  const level = Math.min(4, Math.max(0, p.kyc_level ?? 0)) as KycLevel;
  const uts = Number(p.trust_index ?? 0);
  const completeness = Number(p.kis_completeness ?? uts);
  const band = utsBand(uts);

  const pillars: TrustPillar[] = [
    { id: 'identity', label: 'Identidade', status: p.kyc_identity_status ?? 'missing' },
    { id: 'document', label: 'Documento', status: p.kyc_document_status ?? 'missing' },
    { id: 'email', label: 'Email', status: emailPillar(bundle) },
    { id: 'phone', label: 'Telefone', status: phonePillar(bundle) },
    { id: 'photo', label: 'Fotografia', status: photoPillar(bundle) },
    { id: 'address', label: 'Endereço', status: p.kyc_address_status ?? 'missing' },
    { id: 'banking', label: 'Banco', status: p.kyc_banking_status ?? 'missing' },
  ];

  const nextStepId = suggestNextKisStep({
    emailConfirmed: bundle.emailConfirmed,
    phoneVerified: Boolean(p.phone_verified_at),
    hasPersonal: Boolean(p.legal_full_name?.trim() && p.birth_date && p.nationality),
    hasDocument: Boolean(bundle.document && bundle.document.status !== 'rejected'),
    hasPhoto: Boolean(p.avatar_url),
    hasAddress: Boolean(bundle.address?.province && bundle.address?.municipality),
    hasBanking: Boolean(
      bundle.banking?.iban || bundle.banking?.account_number || bundle.banking?.bank_name,
    ),
  });

  const nextCopy = nextStepCopy(nextStepId, level);
  const unlockHints: string[] = [];
  if (level < 2) {
    unlockHints.push('Com nível 2 desbloqueia contratos, reservas, visitas e Kuteka Pay.');
  } else if (level < 3) {
    unlockHints.push('Com nível 3 a identidade Kuteka fica validada para operações avançadas.');
  } else if (level < 4) {
    unlockHints.push('Com nível 4 (Premium) completa morada verificada e dados bancários.');
  }

  const accountStatus: AccountLifecycleStatus =
    level >= 2 ? 'active' : bundle.emailConfirmed ? 'pending' : 'restricted';

  return {
    accountStatus,
    accountLabel:
      accountStatus === 'active'
        ? 'Conta activa'
        : accountStatus === 'pending'
          ? 'Conta em verificação'
          : 'Conta limitada',
    kycLevel: level,
    kycLabel: KYC_LEVEL_LABELS[level],
    uts,
    utsBand: band,
    utsBandLabel: utsBandLabel(band),
    completeness,
    pillars,
    nextStepId,
    nextStepTitle: nextCopy.title,
    nextStepBody: nextCopy.body,
    unlockHints,
  };
}

function nextStepCopy(step: KisStepId, level: KycLevel): { title: string; body: string } {
  switch (step) {
    case 'contacts':
      return {
        title: 'Verifique o telefone para progredir',
        body:
          level < 2
            ? 'Confirme o telefone e avance a identidade para desbloquear o Kuteka Pay.'
            : 'Verifique o telefone para reforçar o UTS e atingir o próximo nível.',
      };
    case 'personal':
      return {
        title: 'Complete a identidade pessoal',
        body: 'Nome conforme BI, data de nascimento e nacionalidade alimentam contratos automaticamente.',
      };
    case 'document':
      return {
        title: 'Submeta o documento de identificação',
        body: 'BI ou passaporte (frente e verso) — necessário para KYC nível 2 e pagamentos.',
      };
    case 'photo':
      return {
        title: 'Adicione a fotografia oficial',
        body: 'A foto de perfil fortalece a confiança na plataforma e no Passaporte Digital.',
      };
    case 'address':
      return {
        title: 'Valide o endereço',
        body: 'A morada aparece em faturas, recibos e contratos — submeta para verificação.',
      };
    case 'banking':
      return {
        title: 'Adicione dados bancários',
        body: 'Opcional agora; necessário para reembolsos e nível Premium (KYC 4).',
      };
    default:
      return {
        title: 'Perfil KIS em bom estado',
        body: 'Continue a manter documentos válidos. Explore serviços desbloqueados.',
      };
  }
}

/** KAI suggestions derived from the Trust Center / KIS. */
export function buildKisKaiSuggestions(bundle: IdentityBundle): {
  id: string;
  tone: 'info' | 'warn' | 'success' | 'predict';
  title: string;
  body: string;
  href: string;
}[] {
  const model = buildTrustCenterModel(bundle);
  const out: ReturnType<typeof buildKisKaiSuggestions> = [];

  if (model.kycLevel < 2) {
    out.push({
      id: 'kis-pay-gate',
      tone: 'warn',
      title: 'Verifique a identidade para utilizar o Kuteka Pay',
      body: `${statusGlyph('pending')} KYC ${model.kycLevel}/2 · UTS ${Math.round(model.uts)}. ${model.nextStepTitle}`,
      href: '/app/centro-confianca',
    });
  } else if (model.nextStepId === 'contacts' || model.nextStepId === 'address') {
    out.push({
      id: 'kis-next',
      tone: 'info',
      title: model.nextStepTitle,
      body: `Complete o Centro de Confiança (${Math.round(model.completeness)}%) e desbloqueie reservas e serviços.`,
      href: '/app/centro-confianca',
    });
  } else if (model.utsBand === 'excellent' && model.kycLevel >= 3) {
    out.push({
      id: 'kis-strong',
      tone: 'success',
      title: `UTS ${Math.round(model.uts)} — ${model.utsBandLabel}`,
      body: 'Identidade sólida. Pode operar contratos e pagamentos com confiança plena.',
      href: '/app/centro-confianca',
    });
  } else if (model.nextStepId !== 'overview') {
    out.push({
      id: 'kis-complete',
      tone: 'predict',
      title: 'Complete o seu perfil e desbloqueie reservas',
      body: model.nextStepBody,
      href: '/app/centro-confianca',
    });
  }

  return out.slice(0, 2);
}

export function pillarLine(pillar: TrustPillar): string {
  return `${statusGlyph(pillar.status)} ${pillar.label} — ${statusLabel(pillar.status)}`;
}
