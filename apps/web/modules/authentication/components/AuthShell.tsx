import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAuthCopy } from '../content';
import { ConfigMissingBanner } from './ConfigMissingBanner';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Full-bleed atmosphere + brand-first auth composition.
 * Form is the only interactive surface — no decorative cards in the media plane.
 */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const copy = getAuthCopy();

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
            <Link
              href="/"
              className="inline-block font-mono text-sm font-semibold tracking-[0.22em] text-brand-400 transition-colors hover:text-brand-300"
            >
              {copy.brand.name.toUpperCase()}
            </Link>
            <p className="auth-fade-up auth-delay-1 mt-8 max-w-[28ch] text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-tight text-white">
              Património. Confiança. Habitação.
            </p>
            <p className="auth-fade-up auth-delay-2 mt-4 max-w-[36ch] text-base leading-relaxed text-slate-300 sm:text-lg">
              A sua conta abre o espaço Kuteka — simples, seguro e feito para Angola.
            </p>
          </div>

          <div className="auth-fade-up auth-delay-2 w-full max-w-md justify-self-start lg:justify-self-end">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-[2rem]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 text-base leading-relaxed text-slate-300">{subtitle}</p>
            ) : null}
            <ConfigMissingBanner />
            <div className="mt-8 flex flex-col gap-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
