import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@kuteka/shared';
import { getAuthCopy } from '../content';

interface BrandMarkProps {
  href?: string;
  className?: string;
  /** light text on dark auth; dark text on light app chrome */
  tone?: 'light' | 'dark';
  /** Shell uses xl/lg — mark must be immediately recognisable */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE = {
  sm: { img: 36, text: 'text-base', gap: 'gap-2.5', tracking: 'tracking-[0.16em]' },
  md: { img: 48, text: 'text-lg', gap: 'gap-3', tracking: 'tracking-[0.18em]' },
  lg: { img: 64, text: 'text-xl', gap: 'gap-3.5', tracking: 'tracking-[0.2em]' },
  xl: { img: 80, text: 'text-2xl', gap: 'gap-4', tracking: 'tracking-[0.22em]' },
} as const;

/** Official mark: símbolo + KUTEKA (QA-002). */
export function BrandMark({ href = '/', className, tone = 'light', size = 'md' }: BrandMarkProps) {
  const copy = getAuthCopy();
  const s = SIZE[size];
  const textClass =
    tone === 'light'
      ? 'text-brand-400 hover:text-brand-300'
      : 'text-brand-700 hover:text-brand-800';

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center font-mono font-semibold transition-colors',
        s.gap,
        s.text,
        s.tracking,
        textClass,
        className,
      )}
    >
      <Image
        src="/kuteka-logo.svg"
        alt=""
        width={s.img}
        height={s.img}
        className="shrink-0"
        style={{ width: s.img, height: s.img }}
        priority
      />
      <span className="leading-none">{copy.brand.name.toUpperCase()}</span>
    </Link>
  );
}
