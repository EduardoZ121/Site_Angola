import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '@kuteka/shared';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn('text-sm font-medium text-slate-700 dark:text-slate-200', className)}
    {...props}
  />
));

Label.displayName = 'Label';
