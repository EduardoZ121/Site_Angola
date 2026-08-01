import type { ReactNode } from 'react';
import { cn } from '@kuteka/shared';

type SoftListSlotProps = {
  /** True only on the first fetch with no cached rows. */
  pending: boolean;
  className?: string;
  minHeightClassName?: string;
  children?: ReactNode;
};

/**
 * Stable list region — fixed min-height while first fetch runs.
 * No pulse animation, no unmount of surrounding page chrome.
 */
export function SoftListSlot({
  pending,
  className,
  minHeightClassName = 'min-h-[14rem]',
  children,
}: SoftListSlotProps) {
  return (
    <div
      className={cn(minHeightClassName, className)}
      aria-busy={pending || undefined}
      aria-live="polite"
    >
      {pending ? (
        <div className={cn('kuteka-glass', minHeightClassName)}>
          <span className="sr-only">A carregar conteúdo…</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
