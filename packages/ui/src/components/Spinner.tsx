import type { HTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-8 border-[3px]',
} as const;

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'animate-spin rounded-full border-brand-600 border-r-transparent',
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-kuteka bg-slate-200 dark:bg-slate-800', className)}
      {...props}
    />
  );
}
