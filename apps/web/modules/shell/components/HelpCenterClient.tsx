'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';

export function HelpCenterClient() {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const h = shell.helpPage;

  const topics = [
    { label: h.manual, href: '/app/ajuda#manual' },
    { label: h.faq, href: '/app/ajuda#faq' },
    { label: h.videos, href: '/app/ajuda#videos' },
    { label: h.tutorials, href: '/app/ajuda#tutorials' },
    { label: h.howPublish, href: '/app/patrimonios/novo' },
    { label: h.howBuy, href: '/app/habitacao/explorar' },
    { label: h.howRent, href: '/app/habitacao/explorar' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">{shell.userMenu.help}</p>
        <Heading level={1}>{h.title}</Heading>
        <Text className="mt-1 text-slate-700">{h.subtitle}</Text>
      </header>

      <section className="kuteka-detail-panel p-5" id="manual">
        <ul className="grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.label}>
              <Link href={topic.href} className="kuteka-detail-fact block p-4 hover:bg-amber-50/60">
                <p className="font-bold text-slate-900">{topic.label}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="kuteka-detail-panel p-5" id="faq">
        <h2 className="kuteka-detail-title">{h.faq}</h2>
        <p className="kuteka-detail-body mt-2">
          Kuteka liga clientes, parceiros patrimoniais e agentes certificados num só espaço de
          confiança.
        </p>
      </section>

      <section className="kuteka-detail-panel flex flex-col gap-3 p-5" id="videos">
        <h2 className="kuteka-detail-title">{h.videos}</h2>
        <p className="kuteka-detail-body">{h.tutorials}</p>
        <Link
          href="/contacto"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'w-fit')}
        >
          {h.contactCta}
        </Link>
      </section>
    </div>
  );
}
