'use client';

import Link from 'next/link';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getLandingCopy } from '../content';

export function LandingFooter() {
  const { locale } = useLocale();
  const c = getLandingCopy(locale);
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold text-slate-900">{c.footer.brand}</p>
          <p className="mt-1 text-xs text-slate-500">{c.footer.copyright}</p>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {c.footer.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
