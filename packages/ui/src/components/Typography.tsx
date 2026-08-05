import type { HTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export function Heading({
  level = 1,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { level?: 1 | 2 | 3 | 4 }) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';
  const styles = {
    1: 'text-4xl font-semibold tracking-tight text-slate-900',
    2: 'text-3xl font-semibold tracking-tight text-slate-900',
    3: 'text-2xl font-semibold text-slate-900',
    4: 'text-xl font-semibold text-slate-900',
  } as const;

  return <Tag className={cn(styles[level], className)} {...props} />;
}

export function Text({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-base leading-relaxed text-slate-700', className)} {...props} />;
}

export function Muted({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm font-medium text-stone-700', className)} {...props} />;
}
