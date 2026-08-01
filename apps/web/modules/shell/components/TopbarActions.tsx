'use client';

import { buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { getShellCopy } from '../content/pt';

/** Prep slots: notifications (soon) — avatar lives in UserMenu. */
export function TopbarActions() {
  const shell = getShellCopy();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled
        title={shell.notificationsSoon}
        aria-label={shell.notificationsSoon}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'relative px-2 text-slate-400 opacity-70',
        )}
      >
        <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden>
          <path
            d="M10 3.2a4 4 0 0 0-4 4v2.2c0 .7-.3 1.4-.8 1.9L4 12.8h12l-1.2-1.5c-.5-.5-.8-1.2-.8-1.9V7.2a4 4 0 0 0-4-4Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M8.5 15a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </div>
  );
}
