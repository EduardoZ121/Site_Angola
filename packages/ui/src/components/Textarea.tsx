import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-24 w-full rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50',
        invalid && 'border-danger focus-visible:ring-danger',
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
