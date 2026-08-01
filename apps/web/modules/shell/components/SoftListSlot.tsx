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
 * Stable list region — fixed min-height glass while first fetch runs.
 * No pulse animation, no unmount of surrounding page chrome.
 */
export function SoftListSlot({
  pending,
  className,
  minHeightClassName = 'min-h-[14rem]',
  children,
}: SoftListSlotProps) {
  return (
    <div className={cn(minHeightClassName, className)}>
      {pending ? (
        <div className="kuteka-glass h-full" aria-busy="true" aria-live="polite">
          <span className="sr-only">A carregar conteúdo…</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
