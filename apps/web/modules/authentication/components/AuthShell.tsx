import type { ReactNode } from 'react';
import Link from 'next/link';
import { Heading, Text } from '@kuteka/ui';
import { getAuthCopy } from '../content';
import { ConfigMissingBanner } from './ConfigMissingBanner';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Single-column auth composition — brand first, full-bleed calm gradient (slate/orange).
 * No decorative cards in the hero plane.
 */
export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const copy = getAuthCopy();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(234,88,12,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(15,23,42,0.06),_transparent_50%)]"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
        <Link
          href="/"
          className="mb-10 font-mono text-sm font-semibold tracking-[0.2em] text-brand-600 transition-colors hover:text-brand-700"
        >
          {copy.brand.name.toUpperCase()}
        </Link>
        <Heading level={1} className="text-3xl tracking-tight text-slate-900">
          {title}
        </Heading>
        {subtitle ? (
          <Text className="mt-3 text-base leading-relaxed text-slate-600">{subtitle}</Text>
        ) : null}
        <ConfigMissingBanner />
        <div className="mt-8 flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}
