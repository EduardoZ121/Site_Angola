'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { useLocale } from '@/modules/i18n/LocaleProvider';
import { getAuthCopy } from '../content';
import { BrandMark } from './BrandMark';
import { ConfigMissingBanner } from './ConfigMissingBanner';

export type AuthShellKind =
  | 'login'
  | 'register'
  | 'verify'
  | 'recover'
  | 'recoverConfirm'
  | 'onboardingRoles'
  | 'onboardingProfile'
  | 'logout'
  | 'hub';

type AuthShellProps = {
  kind?: AuthShellKind;
  /** Optional override when kind is not enough */
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Full-bleed atmosphere + brand-first auth composition.
 * Titles and hero copy follow the active locale.
 */
export function AuthShell({ kind, title, subtitle, children }: AuthShellProps) {
  const { locale } = useLocale();
  const copy = getAuthCopy(locale);

  const fromKind = (() => {
    switch (kind) {
      case 'login':
        return { title: copy.login.title, subtitle: copy.login.subtitle };
      case 'register':
        return { title: copy.register.title, subtitle: copy.register.subtitle };
      case 'verify':
        return { title: copy.verify.title, subtitle: copy.verify.subtitle };
      case 'recover':
        return { title: copy.recover.request.title, subtitle: copy.recover.request.subtitle };
      case 'recoverConfirm':
        return { title: copy.recover.confirm.title, subtitle: copy.recover.confirm.subtitle };
      case 'onboardingRoles':
        return { title: copy.onboarding.roles.title, subtitle: copy.onboarding.welcomeSubtitle };
      case 'onboardingProfile':
        return {
          title: copy.onboarding.profile.title,
          subtitle: copy.onboarding.profile.subtitle,
        };
      case 'logout':
        return { title: copy.logout.title, subtitle: copy.logout.pending };
      case 'hub':
        return { title: copy.brand.name, subtitle: copy.onboarding.welcomeSubtitle };
      default:
        return { title: title ?? copy.brand.name, subtitle };
    }
  })();

  const heading = title ?? fromKind.title;
  const lead = subtitle ?? fromKind.subtitle;

  const hero = {
    pt: {
      line: 'Património. Confiança. Habitação.',
      body: 'A sua conta abre o espaço Kuteka — simples, seguro e feito para Angola.',
    },
    en: {
      line: 'Property. Trust. Housing.',
      body: 'Your account opens the Kuteka space — simple, secure and built for Angola.',
    },
    fr: {
      line: 'Patrimoine. Confiance. Logement.',
      body: 'Votre compte ouvre l’espace Kuteka — simple, sécurisé et conçu pour l’Angola.',
    },
    es: {
      line: 'Patrimonio. Confianza. Vivienda.',
      body: 'Su cuenta abre el espacio Kuteka — simple, seguro y hecho para Angola.',
    },
  }[locale];

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/92 to-slate-950/55"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50"
      />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="auth-fade-up max-w-xl">
            <BrandMark href="/" variant="inline" tone="light" size="xl" />
            <p className="auth-fade-up auth-delay-1 mt-8 max-w-[28ch] text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-white">
              {hero.line}
            </p>
            <p className="auth-fade-up auth-delay-2 mt-4 max-w-[36ch] text-base leading-relaxed text-slate-300 sm:text-lg">
              {hero.body}
            </p>
          </div>

          <div className="auth-fade-up auth-delay-2 w-full max-w-md justify-self-start lg:justify-self-end">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              {heading}
            </h1>
            {lead ? <p className="mt-3 text-base leading-relaxed text-slate-300">{lead}</p> : null}
            <ConfigMissingBanner />
            <div className="mt-8 flex flex-col gap-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
