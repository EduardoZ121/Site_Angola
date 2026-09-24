/**
 * Official Kuteka contacts already published on the site, terms and privacy policy.
 * Phones, WhatsApp, address and bank details were not published — they stay empty
 * until the Founder Owner fills them. No invented numbers.
 */
export type PublishedCompanyContacts = {
  email: string;
  privacyEmail: string;
  legalEmail: string;
  website: string;
  phone: string;
  phoneSecondary: string;
  whatsapp: string;
  address: string;
  otherContacts: string;
};

export const PUBLISHED_COMPANY_CONTACTS: PublishedCompanyContacts = {
  email: 'contacto@kutekalink.com',
  privacyEmail: 'privacidade@kutekalink.com',
  legalEmail: 'juridico@kutekalink.com',
  website: 'https://kutekalink.com',
  phone: '',
  phoneSecondary: '',
  whatsapp: '',
  address: '',
  otherContacts: 'Email de envio automático (não é contacto público): no-reply@kutekalink.com',
};

const CONTACT_KEYS = Object.keys(PUBLISHED_COMPANY_CONTACTS) as (keyof PublishedCompanyContacts)[];

/** Fill the profile only when no official contact has been stored yet. */
export function mergePublishedContacts<T extends PublishedCompanyContacts>(profile: T): T {
  const untouched = CONTACT_KEYS.every((key) => !String(profile[key] ?? '').trim());
  if (!untouched) return profile;
  return { ...profile, ...PUBLISHED_COMPANY_CONTACTS };
}
