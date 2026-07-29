import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
);

Input.displayName = 'Input';
