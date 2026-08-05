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

export function securityScoreLabel(score: number): string {
  const band = securityScoreBand(score);
  if (band === 'excellent') return 'Excelente';
  if (band === 'high') return 'Bom';
  if (band === 'medium') return 'Moderado';
  return 'A reforçar';
}

export function formatSecurityEvent(type: string): string {
  const map: Record<string, string> = {
    otp_issued: 'Código OTP emitido',
    otp_verified: 'Código OTP validado',
    session_revoked: 'Sessão terminada remotamente',
    login_new: 'Novo login',
    device_new: 'Novo dispositivo',
    password_changed: 'Palavra-passe alterada',
    email_changed: 'Email alterado',
    phone_changed: 'Telefone alterado',
    document_updated: 'Documento actualizado',
    banking_added: 'Conta bancária adicionada',
    recovery_started: 'Recuperação de conta iniciada',
    permissions_changed: 'Permissões alteradas',
  };
  return map[type] ?? type.replace(/_/g, ' ');
}

export { normalizeAngolaPhone };
