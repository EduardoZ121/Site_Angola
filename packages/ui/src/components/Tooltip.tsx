'use client';

import { useId, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@kuteka/shared';

export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'content'> {
  content: ReactNode;
  children: ReactNode;
}

/** Lightweight accessible tooltip (hover/focus). Prefer a full lib later if needed. */
export function Tooltip({ content, children, className, ...props }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-kuteka bg-slate-900 px-2 py-1 text-xs text-white shadow-sm"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
