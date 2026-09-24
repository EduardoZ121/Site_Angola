'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { PUBLISHED_COMPANY_CONTACTS, type PublishedCompanyContacts } from '@/lib/official-company';
import { fetchPublicCompanyContacts } from '@/modules/kocc/services/company-vault-client';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getLandingCopy } from '@/modules/landing/content';
import { getShellCopy } from '../content';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Public contact channels — published defaults until the Owner replaces them. */
const CHANNELS = {
  docs: '/documentacao',
  signIn: '/auth/entrar',
} as const;

export function ContactClient() {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const landing = getLandingCopy(locale);
  const c = shell.contactPage;
  const [contacts, setContacts] = useState<PublishedCompanyContacts>(PUBLISHED_COMPANY_CONTACTS);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicCompanyContacts().then((next) => {
      if (!cancelled) setContacts(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { id: 'email', label: c.email, href: `mailto:${contacts.email}`, external: true },
    { id: 'help', label: c.helpCenter, href: CHANNELS.docs, external: false },
    { id: 'signin', label: landing.topbar.enter, href: CHANNELS.signIn, external: false },
  ];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level={1}>{c.title}</Heading>
          <Text className="mt-2 text-slate-700">{c.subtitle}</Text>
          <p className="mt-2 text-sm font-semibold text-slate-600">{c.hours}</p>
          <p className="mt-3 text-sm text-slate-600">
            Email:{' '}
            <a className="font-medium text-brand-700 underline" href={`mailto:${contacts.email}`}>
              {contacts.email}
            </a>
          </p>
          <ContactLine label="Privacidade" value={contacts.privacyEmail} mailto />
          <ContactLine label="Jurídico" value={contacts.legalEmail} mailto />
          <ContactLine label="Telefone" value={contacts.phone} href={telHref(contacts.phone)} />
          <ContactLine
            label="Segundo telefone"
            value={contacts.phoneSecondary}
            href={telHref(contacts.phoneSecondary)}
          />
          <ContactLine
            label="WhatsApp Business"
            value={contacts.whatsapp}
            href={whatsappHref(contacts.whatsapp)}
          />
          <ContactLine
            label="Facebook"
            value={contacts.facebook}
            href={contacts.facebook.startsWith('http') ? contacts.facebook : undefined}
          />
          <ContactLine label="Endereço" value={contacts.address} />
        </div>
        <LanguageSwitcher variant="compact" />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id}>
            {item.external ? (
              <a
                href={item.href}
                {...(item.href.startsWith('mailto:')
                  ? {}
                  : { target: '_blank', rel: 'noreferrer' })}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40"
              >
                <p className="font-bold text-slate-900">{item.label}</p>
              </a>
            ) : (
              <Link
                href={item.href}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40"
              >
                <p className="font-bold text-slate-900">{item.label}</p>
              </Link>
            )}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link href="/documentacao" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
          {c.helpCenter}
        </Link>
        <Link href="/auth/entrar" className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}>
          {landing.topbar.enter}
        </Link>
      </div>
    </main>
  );
}

function telHref(value: string): string | undefined {
  const digits = value.replace(/\D/g, '');
  return digits ? `tel:+${digits}` : undefined;
}

function whatsappHref(value: string): string | undefined {
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : undefined;
}

function ContactLine({
  label,
  value,
  mailto = false,
  href,
}: {
  label: string;
  value: string;
  mailto?: boolean;
  href?: string;
}) {
  if (!value.trim()) return null;
  const link = href ?? (mailto ? `mailto:${value}` : undefined);
  return (
    <p className="mt-1 text-sm text-slate-600">
      {label}:{' '}
      {link ? (
        <a
          className="font-medium text-brand-700 underline"
          href={link}
          {...(link.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {value}
        </a>
      ) : (
        <span className="font-medium text-slate-800">{value}</span>
      )}
    </p>
  );
}
