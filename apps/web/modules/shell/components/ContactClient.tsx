'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getLandingCopy } from '@/modules/landing/content';
import { getShellCopy } from '../content';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Public contact channels — only verified production contacts (no placeholder phones). */
const CHANNELS = {
  email: 'mailto:contacto@kutekalink.com',
  docs: '/documentacao',
  signIn: '/auth/entrar',
} as const;

export function ContactClient() {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const landing = getLandingCopy(locale);
  const c = shell.contactPage;

  const items = [
    { id: 'email', label: c.email, href: CHANNELS.email, external: true },
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
            <a className="font-medium text-brand-700 underline" href={CHANNELS.email}>
              contacto@kutekalink.com
            </a>
          </p>
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
