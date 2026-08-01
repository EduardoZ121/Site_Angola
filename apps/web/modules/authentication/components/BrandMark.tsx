import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@kuteka/shared';
import { getAuthCopy } from '../content';

interface BrandMarkProps {
  href?: string;
  className?: string;
  /** light text on dark auth chrome; dark text on light surfaces */
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * shell — official lockup on white plate (readable on dark nav).
   * inline — compact mark + wordmark for light headers.
   */
  variant?: 'shell' | 'inline';
}

/** Official SVG is a wide lockup (620×220) — never force square crop. */
const SHELL_SIZE = {
  sm: { w: 148, h: 52 },
  md: { w: 176, h: 62 },
  lg: { w: 200, h: 70 },
  xl: { w: 228, h: 80 },
} as const;

const INLINE_SIZE = {
  sm: { w: 112, h: 40 },
  md: { w: 140, h: 50 },
  lg: { w: 168, h: 60 },
  xl: { w: 196, h: 70 },
} as const;

/**
 * Official Kuteka lockup — original colours, no filters.
 * On dark chrome uses a white plate so the navy mark stays visible.
 */
export function BrandMark({
  href = '/',
  className,
  tone = 'light',
  size = 'md',
  variant = 'inline',
}: BrandMarkProps) {
  const copy = getAuthCopy();
  const dims = variant === 'shell' ? SHELL_SIZE[size] : INLINE_SIZE[size];

  if (variant === 'shell') {
    return (
      <Link
        href={href}
        className={cn(
          'block rounded-xl bg-white p-3 shadow-sm ring-1 ring-white/80 transition hover:shadow-md',
          className,
        )}
        aria-label={copy.brand.name}
      >
        <Image
          src="/kuteka-logo.svg"
          alt={copy.brand.name}
          width={dims.w}
          height={dims.h}
          className="h-auto w-full max-w-full object-contain object-left"
          style={{ width: dims.w, height: 'auto', maxHeight: dims.h }}
          priority
          unoptimized
        />
        <p className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#08263f]/80">
          Gestão patrimonial
        </p>
      </Link>
    );
  }

  const plate =
    tone === 'light'
      ? 'rounded-lg bg-white/95 px-2.5 py-1.5 shadow-sm ring-1 ring-white/70'
      : 'rounded-lg bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-slate-200';

  return (
    <Link
      href={href}
      className={cn('inline-flex items-center', plate, className)}
      aria-label={copy.brand.name}
    >
      <Image
        src="/kuteka-logo.svg"
        alt={copy.brand.name}
        width={dims.w}
        height={dims.h}
        className="object-contain object-left"
        style={{ width: dims.w, height: 'auto', maxHeight: dims.h }}
        priority
        unoptimized
      />
    </Link>
  );
}
