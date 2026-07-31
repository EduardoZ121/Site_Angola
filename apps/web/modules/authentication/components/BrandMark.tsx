import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@kuteka/shared';
import { getAuthCopy } from '../content';

interface BrandMarkProps {
  href?: string;
  className?: string;
  /** light text on dark auth; dark text on light app chrome */
  tone?: 'light' | 'dark';
}

/** Official mark: símbolo + KUTEKA (QA-002). */
export function BrandMark({ href = '/', className, tone = 'light' }: BrandMarkProps) {
  const copy = getAuthCopy();
  const textClass =
    tone === 'light'
      ? 'text-brand-400 hover:text-brand-300'
      : 'text-brand-600 hover:text-brand-700';

  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-2.5 font-mono text-sm font-semibold tracking-[0.18em] transition-colors',
        textClass,
        className,
      )}
    >
      <Image
        src="/kuteka-logo.svg"
        alt=""
        width={28}
        height={28}
        className="size-7 shrink-0"
        priority
      />
      <span>{copy.brand.name.toUpperCase()}</span>
    </Link>
  );
}
