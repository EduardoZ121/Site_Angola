import type { HTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
} as const;

export function Avatar({
  src,
  alt = '',
  fallback = '?',
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-100',
        sizes[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{fallback.slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  );
}
