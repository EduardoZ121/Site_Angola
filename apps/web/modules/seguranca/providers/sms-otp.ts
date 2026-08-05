/**
 * SMS OTP provider contract — Angola-ready.
 * Swap SandboxSmsOtpProvider for Twilio / MessageBird / Infobip without schema changes.
 */

export type SmsOtpPurpose = 'phone_verify' | 'recovery' | 'login' | 'sensitive_change' | 'step_up';

export type SmsSendResult =
  | {
      ok: true;
      provider: string;
      messageId: string;
      /** Present only in sandbox / non-production adapters. */
      sandboxCode?: string;
    }
  | { ok: false; error: string; retryable?: boolean };

export type SmsOtpProvider = {
  readonly id: 'sandbox' | 'twilio' | 'messagebird' | 'infobip' | 'other';
  sendOtp(input: {
    toE164: string;
    code: string;
    purpose: SmsOtpPurpose;
    locale?: string;
  }): Promise<SmsSendResult>;
};

/** Normalise Angola-friendly local numbers toward E.164 when possible. */
export function normalizeAngolaPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, '').trim();
  if (!digits) return null;
  if (digits.startsWith('+')) {
    return digits.length >= 10 ? digits : null;
  }
  const only = digits.replace(/\D/g, '');
  if (only.startsWith('244') && only.length >= 12) {
    return `+${only}`;
  }
  if (only.startsWith('9') && only.length === 9) {
    return `+244${only}`;
  }
  if (only.length >= 9) {
    return `+${only}`;
  }
  return null;
}

export class SandboxSmsOtpProvider implements SmsOtpProvider {
  readonly id = 'sandbox' as const;

  async sendOtp(input: {
    toE164: string;
    code: string;
    purpose: SmsOtpPurpose;
    locale?: string;
  }): Promise<SmsSendResult> {
    // Architecture-ready: log shape only; never ship real SMS from sandbox.
    if (typeof console !== 'undefined') {
      console.info('[kuteka:sms:sandbox]', {
        to: input.toE164,
        purpose: input.purpose,
        codeLength: input.code.length,
      });
    }
    return {
      ok: true,
      provider: 'sandbox',
      messageId: `sandbox_${Date.now()}`,
      sandboxCode: input.code,
    };
  }
}

/** Placeholder — wire credentials when Angola SMS vendor is chosen. */
export class StubProductionSmsOtpProvider implements SmsOtpProvider {
  readonly id: SmsOtpProvider['id'];

  constructor(id: Exclude<SmsOtpProvider['id'], 'sandbox'> = 'other') {
    this.id = id;
  }

  async sendOtp(): Promise<SmsSendResult> {
    return {
      ok: false,
      error: 'SMS provider not configured. Enable security.sms_otp and set vendor credentials.',
      retryable: false,
    };
  }
}

let activeProvider: SmsOtpProvider = new SandboxSmsOtpProvider();

export function getSmsOtpProvider(): SmsOtpProvider {
  return activeProvider;
}

/** Test / boot hook — production boot should set Twilio|MessageBird|Infobip. */
export function setSmsOtpProvider(provider: SmsOtpProvider): void {
  activeProvider = provider;
}
