import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);

Checkbox.displayName = 'Checkbox';
