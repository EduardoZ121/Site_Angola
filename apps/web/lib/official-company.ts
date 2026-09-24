/**
 * Official Kuteka contacts.
 * Phones given by the Founder Owner. Facebook is a field with no page yet.
 * Bank details stay empty until the Owner fills them.
 */
export type PublishedCompanyContacts = {
  email: string;
  privacyEmail: string;
  legalEmail: string;
  website: string;
  phone: string;
  phoneSecondary: string;
  whatsapp: string;
  facebook: string;
  address: string;
  otherContacts: string;
};

export const PUBLISHED_COMPANY_CONTACTS: PublishedCompanyContacts = {
  email: 'contacto@kutekalink.com',
  privacyEmail: 'privacidade@kutekalink.com',
  legalEmail: 'juridico@kutekalink.com',
  website: 'https://kutekalink.com',
  phone: '+244 957 871 557',
  phoneSecondary: '+244 935 404 400',
  whatsapp: '+244 935 404 400',
  facebook: '',
  address: '',
  otherContacts: 'Email de envio automático (não é contacto público): no-reply@kutekalink.com',
};

const CONTACT_KEYS = Object.keys(PUBLISHED_COMPANY_CONTACTS) as (keyof PublishedCompanyContacts)[];

/** Fill each empty contact from the published value. A value the Owner set is kept. */
export function mergePublishedContacts<T extends PublishedCompanyContacts>(profile: T): T {
  const next = { ...profile };
  for (const key of CONTACT_KEYS) {
    const published = PUBLISHED_COMPANY_CONTACTS[key];
    if (!String(next[key] ?? '').trim() && published) {
      next[key] = published as T[typeof key];
    }
  }
  return next;
}
