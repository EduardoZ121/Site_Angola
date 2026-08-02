'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';
import { LanguageSwitcher } from './LanguageSwitcher';

const CHANNELS = {
  whatsapp: 'https://wa.me/244900000000',
  phone: 'tel:+244900000000',
  email: 'mailto:contacto@kuteka.ao',
};

export function ContactClient() {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const c = shell.contactPage;

  const items = [
    { id: 'whatsapp', label: c.whatsapp, href: CHANNELS.whatsapp, external: true },
    { id: 'phone', label: c.phone, href: CHANNELS.phone, external: true },
    { id: 'email', label: c.email, href: CHANNELS.email, external: true },
    { id: 'chat', label: c.chat, href: '#chat', external: false },
    { id: 'help', label: c.helpCenter, href: '/app/ajuda', external: false },
  ];

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-6 py-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level={1}>{c.title}</Heading>
          <Text className="mt-2 text-slate-700">{c.subtitle}</Text>
          <p className="mt-2 text-sm font-semibold text-slate-600">{c.hours}</p>
        </div>
        <LanguageSwitcher variant="compact" />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} id={item.id === 'chat' ? 'chat' : undefined}>
            <a
              href={item.href}
              {...(item.external ? { target: '_blank', rel: 'noreferrer' } : {})}
              className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/40"
            >
              <p className="font-bold text-slate-900">{item.label}</p>
            </a>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Link href="/app" className={cn(buttonVariants({ variant: 'primary' }), 'w-fit')}>
          {shell.items.home}
        </Link>
        <Link href="/app/ajuda" className={cn(buttonVariants({ variant: 'secondary' }), 'w-fit')}>
          {c.helpCenter}
        </Link>
      </div>
    </main>
  );
}
