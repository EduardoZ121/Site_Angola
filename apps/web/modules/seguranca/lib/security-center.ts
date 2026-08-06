import type { AppLocale } from '@/modules/i18n/types';
import { getSegurancaCopy } from '../content';
import { normalizeAngolaPhone } from '../providers/sms-otp';

export type SecurityDevice = {
  id: string;
  label: string | null;
  platform: string | null;
  last_ip: string | null;
  trusted_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

export type SecuritySession = {
  id: string;
  session_key: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
};

export type SecurityEvent = {
  id: string;
  event_type: string;
  severity: string;
  channel: string | null;
  created_at: string;
  payload: Record<string, unknown>;
  notify?: boolean;
};

export type SecurityCenterSnapshot = {
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  kycLevel: number;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  securityScore: number;
  adminPostureOk?: boolean;
  devices: SecurityDevice[];
  sessions: SecuritySession[];
  recentEvents: SecurityEvent[];
  flags: {
    emailOtp: boolean;
    smsOtpPrepared: boolean;
    mfaPrepared: boolean;
    trustedDevicesPrepared: boolean;
    remoteRevokePrepared?: boolean;
  };
};

export function securityScoreBand(score: number): 'low' | 'medium' | 'high' | 'excellent' {
  if (score >= 80) return 'excellent';
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function securityScoreLabel(score: number, locale: AppLocale = 'pt'): string {
  const band = securityScoreBand(score);
  const labels = getSegurancaCopy(locale).scoreLabels;
  if (band === 'excellent') return labels.excellent;
  if (band === 'high') return labels.high;
  if (band === 'medium') return labels.medium;
  return labels.low;
}

export function formatSecurityEvent(type: string, locale: AppLocale = 'pt'): string {
  const map = getSegurancaCopy(locale).events as Record<string, string>;
  return map[type] ?? type.replace(/_/g, ' ');
}

export { normalizeAngolaPhone };
