import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export type RadioProps = InputHTMLAttributes<HTMLInputElement>;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="radio"
    className={cn(
      'size-4 border-slate-300 text-brand-600 focus:ring-brand-600 disabled:opacity-50',
      className,
    )}
    {...props}
  />
));

Radio.displayName = 'Radio';
