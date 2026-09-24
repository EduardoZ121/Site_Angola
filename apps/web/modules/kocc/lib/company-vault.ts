import { mergePublishedContacts, type PublishedCompanyContacts } from '@/lib/official-company';

export type CompanyProfileInput = PublishedCompanyContacts & {
  bankName: string;
  iban: string;
  accountNumber: string;
  accountHolder: string;
  currency: string;
  paymentNotes: string;
};

export const EMPTY_COMPANY_PROFILE: CompanyProfileInput = {
  bankName: '',
  iban: '',
  accountNumber: '',
  accountHolder: '',
  currency: 'AOA',
  paymentNotes: '',
  phone: '',
  phoneSecondary: '',
  whatsapp: '',
  email: '',
  privacyEmail: '',
  legalEmail: '',
  website: '',
  address: '',
  otherContacts: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IBAN_RE = /^[A-Z]{2}[0-9A-Z]{13,32}$/;

export function normalizeIban(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

function emailError(value: string, label: string): string | null {
  const email = value.trim();
  if (email && !EMAIL_RE.test(email)) return `${label} inválido.`;
  return null;
}

/** Client-side gate. The database repeats these checks and is the authority. */
export function validateCompanyProfile(input: CompanyProfileInput): string | null {
  const iban = normalizeIban(input.iban);
  if (iban && !IBAN_RE.test(iban))
    return 'IBAN inválido. Use o formato internacional, sem espaços.';
  const emailIssue =
    emailError(input.email, 'Email oficial') ||
    emailError(input.privacyEmail, 'Email de privacidade') ||
    emailError(input.legalEmail, 'Email jurídico');
  if (emailIssue) return emailIssue;
  const currency = input.currency.trim().toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency))
    return 'A moeda deve ter 3 letras, por exemplo AOA.';
  if (input.bankName.trim().length > 80) return 'O nome do banco é demasiado longo.';
  if (
    input.phone.trim().length > 32 ||
    input.phoneSecondary.trim().length > 32 ||
    input.whatsapp.trim().length > 32
  ) {
    return 'O telefone é demasiado longo.';
  }
  if (input.website.trim().length > 200) return 'O site é demasiado longo.';
  return null;
}

export function validateVaultCode(code: string): string | null {
  const trimmed = code.trim();
  if (trimmed.length < 8 || trimmed.length > 64) {
    return 'O código do cofre deve ter entre 8 e 64 caracteres.';
  }
  return null;
}

export function profileFromRpc(raw: Record<string, unknown>): CompanyProfileInput & {
  updatedAt: string | null;
} {
  const str = (key: string) => (raw[key] == null ? '' : String(raw[key]));
  const profile = mergePublishedContacts({
    bankName: str('bankName'),
    iban: str('iban'),
    accountNumber: str('accountNumber'),
    accountHolder: str('accountHolder'),
    currency: str('currency') || 'AOA',
    paymentNotes: str('paymentNotes'),
    phone: str('phone'),
    phoneSecondary: str('phoneSecondary'),
    whatsapp: str('whatsapp'),
    email: str('email'),
    privacyEmail: str('privacyEmail'),
    legalEmail: str('legalEmail'),
    website: str('website'),
    address: str('address'),
    otherContacts: str('otherContacts'),
  });
  return {
    ...profile,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : null,
  };
}

export function vaultErrorMessage(raw: string): string {
  const message = raw.toUpperCase();
  if (message.includes('DOES NOT EXIST') || message.includes('COULD NOT FIND')) {
    return 'O cofre institucional ainda não está activo neste ambiente.';
  }
  if (message.includes('KUTEKA_VAULT_LOCKED') || message.includes('BLOQUEADO')) {
    return 'Cofre bloqueado depois de várias tentativas. Aguarde cerca de 15 minutos.';
  }
  if (message.includes('KUTEKA_VAULT_UNSET')) {
    return 'Defina primeiro o código do cofre. Não é a senha da conta.';
  }
  if (message.includes('KUTEKA_VAULT_FORBIDDEN') || message.includes('KUTEKA_VAULT_AUTH')) {
    return 'Só o Founder Owner autenticado pode abrir esta área.';
  }
  if (message.includes('KUTEKA_VAULT_BAD_CODE')) return 'Código do cofre incorrecto.';
  if (message.includes('KUTEKA_VAULT_CODE_LENGTH')) {
    return 'O código do cofre deve ter entre 8 e 64 caracteres.';
  }
  if (message.includes('KUTEKA_VAULT_IBAN'))
    return 'IBAN inválido. Use o formato internacional, sem espaços.';
  if (message.includes('KUTEKA_VAULT_EMAIL')) return 'Email oficial inválido.';
  if (message.includes('KUTEKA_VAULT_FIELD')) return 'Há um campo institucional inválido.';
  return 'Não foi possível concluir a operação. Tente novamente.';
}
