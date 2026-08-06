'use client';

import Link from 'next/link';
import { Heading, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getShellCopy } from '../content';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SettingsClient() {
  const { locale } = useLocale();
  const shell = getShellCopy(locale);
  const s = shell.settingsPage;

  return (
    <div className="flex flex-col gap-5">
      <header className="kuteka-detail-panel p-5">
        <p className="kuteka-detail-eyebrow">{shell.userMenu.settings}</p>
        <Heading level={1}>{s.title}</Heading>
        <Text className="mt-1 text-slate-700">{s.subtitle}</Text>
      </header>

      <section className="kuteka-detail-panel p-5" id="idioma" aria-labelledby="settings-lang">
        <h2 id="settings-lang" className="kuteka-detail-title">
          {s.language}
        </h2>
        <p className="kuteka-detail-body mt-1">{shell.languageHint}</p>
        <div className="mt-4">
          <LanguageSwitcher />
        </div>
        <p className="kuteka-detail-meta mt-3">{s.saveLocale}</p>
      </section>

      <section className="kuteka-detail-panel p-5" aria-labelledby="settings-currency">
        <h2 id="settings-currency" className="kuteka-detail-title">
          {s.currency}
        </h2>
        <p className="kuteka-detail-body mt-1">AOA (Kz)</p>
      </section>

      <section className="kuteka-detail-panel p-5" aria-labelledby="settings-theme">
        <h2 id="settings-theme" className="kuteka-detail-title">
          {s.theme}
        </h2>
        <p className="kuteka-detail-body mt-1">
          A Beta usa painéis claros sobre a atmosfera Kuteka — o tema claro está activo para
          garantir contraste e legibilidade.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          <li className="kuteka-detail-chip kuteka-detail-chip--accent">{s.themeLight}</li>
        </ul>
      </section>

      <section
        className="kuteka-detail-panel p-5"
        id="notificacoes"
        aria-labelledby="settings-notif"
      >
        <h2 id="settings-notif" className="kuteka-detail-title">
          {s.notifications}
        </h2>
        <p className="kuteka-detail-body mt-1">{s.notificationsHint}</p>
      </section>

      <section className="kuteka-detail-panel p-5" aria-labelledby="settings-privacy">
        <h2 id="settings-privacy" className="kuteka-detail-title">
          {s.privacy}
        </h2>
        <p className="kuteka-detail-body mt-1">{s.privacyHint}</p>
        <Link
          href="/privacidade"
          className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-3 w-fit')}
        >
          {s.privacy}
        </Link>
      </section>

      <section className="kuteka-detail-panel p-5" aria-labelledby="settings-security">
        <h2 id="settings-security" className="kuteka-detail-title">
          {s.security}
        </h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <p className="kuteka-detail-label">{s.security}</p>
            <p className="kuteka-detail-body">{shell.securityCenterHint}</p>
            <Link
              href="/app/centro-seguranca"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-2 w-fit')}
            >
              {s.security}
            </Link>
          </div>
          <div>
            <p className="kuteka-detail-label">{s.password}</p>
            <p className="kuteka-detail-body">{s.passwordHint}</p>
            <Link
              href="/auth/recuperar"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-2 w-fit')}
            >
              {s.password}
            </Link>
          </div>
          <div>
            <p className="kuteka-detail-label">{s.sessions}</p>
            <p className="kuteka-detail-body">{s.sessionsHint}</p>
            <Link
              href="/auth/sair"
              className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }), 'mt-2 w-fit')}
            >
              {shell.userMenu.logout}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
